import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Checks if the app is running on a native platform (iOS/Android)
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Gets the current platform
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};

/**
 * Downloads/saves a PDF file natively on iOS/Android or via browser on web
 * @param pdfBlob - The PDF as a Blob or base64 string
 * @param fileName - The name of the file to save
 */
export const downloadPDF = async (
  pdfData: Blob | string,
  fileName: string
): Promise<boolean> => {
  try {
    if (isNativePlatform()) {
      // Native platform - use Capacitor Filesystem and Share
      console.log('Downloading PDF on native platform:', getPlatform());
      
      let base64Data: string;
      
      if (pdfData instanceof Blob) {
        // Convert Blob to base64
        base64Data = await blobToBase64(pdfData);
      } else {
        // Already base64
        base64Data = pdfData;
      }
      
      // Remove data URL prefix if present
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }
      
      // Save file to device
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });
      
      console.log('PDF saved at:', savedFile.uri);
      
      // Get the file URI for sharing
      const fileUri = savedFile.uri;
      
      // Use Share to open the native share sheet or save dialog
      await Share.share({
        title: fileName,
        text: `Relatório ${fileName}`,
        url: fileUri,
        dialogTitle: 'Salvar ou compartilhar PDF',
      });
      
      return true;
    } else {
      // Web platform - use browser download
      console.log('Downloading PDF on web platform');
      
      let blob: Blob;
      
      if (pdfData instanceof Blob) {
        blob = pdfData;
      } else {
        // Convert base64 to Blob
        const byteCharacters = atob(pdfData.split(',')[1] || pdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'application/pdf' });
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

/**
 * Converts a Blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Saves a file directly to device (iOS/Android) without share sheet
 * Returns the file path
 */
export const saveFileToDevice = async (
  data: string,
  fileName: string,
  directory: Directory = Directory.Documents
): Promise<string> => {
  if (!isNativePlatform()) {
    throw new Error('saveFileToDevice only works on native platforms');
  }
  
  const result = await Filesystem.writeFile({
    path: fileName,
    data: data,
    directory: directory,
    recursive: true,
  });
  
  return result.uri;
};
