<script lang="ts">
  // Knöpfe der unteren Leiste, solange eine PDF-Vorschau offen ist
  import type { PdfPreview } from './pdfPreview.svelte';

  let { preview }: { preview: PdfPreview } = $props();
  let printFrame = $state<HTMLIFrameElement>();

  // Unsichtbarer Frame mit dem PDF; wo der Browser das nicht drucken kann, PDF in neuem Tab öffnen
  function print() {
    try {
      printFrame?.contentWindow?.print();
    } catch {
      window.open(preview.url!, '_blank');
    }
  }
</script>

{#if preview.url}
  <button class="secondary" onclick={() => preview.close()}>Bearbeiten</button>
  <span class="spacer"></span>
  <button class="tool" title="Drucken" aria-label="Drucken" onclick={print}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
      />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  </button>
  <a
    class="tool"
    title="Herunterladen"
    aria-label="Herunterladen"
    href={preview.url}
    download={preview.file?.name}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  </a>
  {#if preview.canShare}
    <button class="tool primary" title="Teilen" aria-label="Teilen" onclick={() => preview.share()}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
      </svg>
    </button>
  {/if}
  <iframe class="print-frame" bind:this={printFrame} src={preview.url} title="Druckansicht"
  ></iframe>
{/if}
