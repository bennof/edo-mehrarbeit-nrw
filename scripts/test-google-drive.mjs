// Offline-Vertragstests: keine Google-Konten oder echten Zugangsdaten notwendig.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync('src/lib/googleDrive.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const calls = [];
let replies = [];
let authResponse = {
  access_token: 'test-token',
  expires_in: 3600,
  scope: 'https://www.googleapis.com/auth/drive.file'
};
const fetchMock = async (url, init = {}) => {
  calls.push({ url, init });
  assert.ok(replies.length, `Unexpected request: ${url}`);
  const [body, status = 200] = replies.shift();
  return new Response(JSON.stringify(body), { status });
};
const exports = {};
new Function('exports', 'require', '__GOOGLE_CLIENT_ID__', 'fetch', 'window', 'document', source)(
  exports,
  () => ({ base: '/app' }),
  'test-client',
  fetchMock,
  {
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config) {
            assert.equal(config.scope, 'https://www.googleapis.com/auth/drive.file');
            return {
              requestAccessToken() {
                config.callback(authResponse);
              }
            };
          }
        }
      }
    }
  },
  {
    createElement: () => ({}),
    head: {
      append(script) {
        script.onload();
      }
    }
  }
);
replies = [[{}]];
await exports.prepareDrive();
assert.equal(calls[0].url, '/app/config.json');
await exports.connectDrive();
replies = [[{ files: [] }], [{ id: 'app-folder' }], [{ id: 'backup' }]];
await exports.saveBackup('{"months":[]}');
const creation = calls.at(-2);
assert.equal(JSON.parse(creation.init.body).name, 'edoMehrarbeitNRW');
const upload = calls.at(-1);
assert.ok(upload.init.body.includes('"parents":["app-folder"]'));
assert.ok(upload.init.body.includes('{"months":[]}'));
assert.equal(upload.init.headers.get('Authorization'), 'Bearer test-token');
replies = [[{ files: [{ id: 'app-folder' }] }], [{}]];
const before = calls.length;
await exports.saveBackup('{}');
assert.equal(calls.length - before, 2, 'Existing folder reused');
replies = [
  [{ files: [{ id: 'app-folder' }] }],
  [{ files: [{ id: 'older', createdTime: '2026-01-01' }], nextPageToken: 'page2' }],
  [{ files: [{ id: 'newer', createdTime: '2026-02-01' }] }]
];
assert.deepEqual(
  (await exports.listBackups()).map((f) => f.id),
  ['newer', 'older']
);
assert.ok(new URL(calls.at(-1).url).searchParams.get('q').includes("'app-folder' in parents"));
assert.equal(new URL(calls.at(-1).url).searchParams.get('pageToken'), 'page2');
replies = [[{ profile: {}, months: [] }]];
assert.deepEqual(
  JSON.parse(await (await exports.loadBackup({ id: 'newer', name: 'backup.json' })).text()),
  { profile: {}, months: [] }
);
replies = [[{}, 401]];
await assert.rejects(exports.listBackups(), /erneut/);
await assert.rejects(exports.saveBackup('{}'), /abgelaufen/);
authResponse = { ...authResponse, scope: '' };
await assert.rejects(exports.connectDrive(), /nicht freigegeben/);
authResponse = {
  ...authResponse,
  scope: 'https://www.googleapis.com/auth/drive.file',
  expires_in: 0
};
await exports.connectDrive();
await assert.rejects(exports.listBackups(), /abgelaufen/);
exports.disconnectDrive();
assert.equal(replies.length, 0);
console.log(
  'Drive: Ordneranlage/-wiederverwendung, Upload, Pagination, Download, fehlende Freigabe, 401 und Tokenablauf geprüft.'
);
