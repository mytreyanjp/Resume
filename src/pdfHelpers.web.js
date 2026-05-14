let html2pdf;
let pdfjsLib;

export const loadLibraries = async () => {
  if (typeof window !== 'undefined') {
    try {
      const html2pdfModule = await import('html2pdf.js');
      html2pdf = html2pdfModule.default || html2pdfModule;

      const pdfjsModule = await import('pdfjs-dist');
      pdfjsLib = pdfjsModule;
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }
    } catch (e) {
      try {
        html2pdf = require('html2pdf.js');
        pdfjsLib = require('pdfjs-dist');
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }
      } catch (e2) {
        console.error('Failed to load PDF libraries', e2);
      }
    }
  }
};

export const getHtml2Pdf = () => html2pdf;
export const getPdfjsLib = () => pdfjsLib;
export const getPdfLib = async () => {
  try {
    return await import('pdf-lib');
  } catch (e) {
    return null;
  }
};