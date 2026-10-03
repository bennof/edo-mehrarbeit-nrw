// Zustand einer PDF-Vorschau (Erklärung, Nachweis nach Anlage 1): erzeugen, teilen, verwerfen.
// Die Knöpfe dazu liefert PdfToolbar.svelte.

export class PdfPreview {
  url = $state<string | null>(null);
  file = $state<File | null>(null);
  busy = $state(false);
  error = $state('');
  // System-Teilen (Handy: Drucken, Dateien, Mail …) nur, wenn der Browser Dateien teilen kann
  canShare = $derived(!!this.file && !!navigator.canShare?.({ files: [this.file] }));

  async open(build: () => Promise<Blob>, fileName: string) {
    this.busy = true;
    this.error = '';
    try {
      this.close();
      const blob = await build();
      this.file = new File([blob], fileName, { type: 'application/pdf' });
      this.url = URL.createObjectURL(blob);
    } catch (e) {
      this.error = `PDF konnte nicht erzeugt werden: ${e instanceof Error ? e.message : e}`;
    }
    this.busy = false;
  }

  close() {
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
    this.file = null;
  }

  async share() {
    if (!this.file) return;
    try {
      await navigator.share({ files: [this.file], title: this.file.name });
    } catch (e) {
      // Abbrechen im Teilen-Menü ist kein Fehler
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        this.error = `Teilen fehlgeschlagen: ${e instanceof Error ? e.message : e}`;
      }
    }
  }
}
