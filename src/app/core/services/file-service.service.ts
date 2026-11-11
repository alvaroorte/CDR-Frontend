import { Injectable } from '@angular/core';

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
}
