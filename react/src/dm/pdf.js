// Extract plain text from a PDF File using pdfjs-dist.
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageTexts = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) =>
      pdf
        .getPage(i + 1)
        .then((p) => p.getTextContent())
        .then((c) => c.items.map((item) => item.str).join(' ')),
    ),
  )
  return pageTexts.join('\n\n')
}
