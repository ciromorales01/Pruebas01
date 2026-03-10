
/**
 * Extrae texto de un archivo PDF utilizando la librería pdf.js cargada globalmente.
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  // Usamos (window as any) para evitar errores de TypeScript al acceder por string
  const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
  
  if (!pdfjsLib) {
    throw new Error("PDF.js library not loaded");
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n\n";
  }
  
  return fullText.trim();
};
