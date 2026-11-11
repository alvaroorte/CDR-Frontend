import { Injectable } from '@angular/core';

/** MIME de los archivos que descarga el sistema. */
export const MIME_EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Utilidades de archivos (versión reducida del FileService de la referencia: aquí no hay adjuntos). */
@Injectable({
   providedIn: 'root'
})
export class FileService {

   /** Lee un archivo como base64. Con getCleanBase64 = true se quita el prefijo "data:...;base64,". */
   public convertFileToBase64(file: File, getCleanBase64: boolean): Promise<string> {
      return new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.readAsDataURL(file);
         reader.onload = () => {
            const base64Image = reader.result as string;
            resolve(getCleanBase64 ? base64Image.split(',')[1] : base64Image);
         };
         reader.onerror = error => reject(error);
      });
   }

   /** Base64 → File (igual que convertBase64ToFile de la referencia). */
   public convertBase64ToFile(base64String: string, fileName: string, mimeType: string): File {
      const byteCharacters = atob(base64String);
      const bytes = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
         bytes[i] = byteCharacters.charCodeAt(i);
      }
      return new File([bytes], fileName, { type: mimeType });
   }

   /** Descarga el archivo en el navegador (igual que downloadFile de la referencia). */
   public downloadFile(file: File, fileName: string): void {
      const url = window.URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
   }
}
