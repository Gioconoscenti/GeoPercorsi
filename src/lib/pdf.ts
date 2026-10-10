import * as pdfjs from 'pdfjs-dist'

// il worker è servito come file statico (public/), senza passare dal bundler
const BASE = import.meta.env.BASE_URL + 'pdfjs/'
pdfjs.GlobalWorkerOptions.workerSrc = BASE + 'pdf.worker.min.mjs'

/** Converte le pagine di un PDF in immagini (data URL), max 60 pagine */
export async function renderPdf(blob: Blob, scala = 1.6): Promise<string[]> {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
    cMapUrl: BASE + 'cmaps/',
    cMapPacked: true,
    standardFontDataUrl: BASE + 'standard_fonts/',
    wasmUrl: BASE + 'wasm/',
    iccUrl: BASE + 'iccs/',
  }).promise
  const pagine: string[] = []
  for (let i = 1; i <= Math.min(doc.numPages, 60); i++) {
    const page = await doc.getPage(i)
    const viewport = page.getViewport({ scale: scala })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvas, viewport }).promise
    pagine.push(canvas.toDataURL('image/jpeg', 0.85))
  }
  return pagine
}
