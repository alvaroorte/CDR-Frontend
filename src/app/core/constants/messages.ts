import { LIMITS } from "./limits";

/** Mensajes de UI (patrón de la referencia, depurado de los propios de tickets). */
export const MESSAGES = {
   deniedCharactersCode:
      'Ingrese solo caracteres alfanuméricos, guiones, guiones bajos y barras inclinadas.',
   deniedCharactersName:
      'Ingrese solo caracteres alfanuméricos, guiones, guiones bajos, barras inclinadas y puntos.',
   requiredMinLength: `Este campo requiere como mínimo ${LIMITS.minLengthFive} caracteres.`,
   requiredMinLengthCode: `Este campo requiere como mínimo ${LIMITS.minLengthThree} caracteres.`,
   requiredMaxLengthDescription: `Este campo acepta como máximo ${LIMITS.maxLengthDescription} caracteres.`,
   recordDeleted: 'El registro se eliminó correctamente',
   recordCreated: 'El registro fue creado correctamente',
   recordUpdated: 'El registro fue editado correctamente',
   expiredSession: 'Su sesión ha caducado.',
   maxlength: 'El campo ha superado el número máximo de caracteres.',
   noOnlySpace: 'El campo no acepta solo espacios en blanco.',
   showingFirstToLastOfItems: 'Mostrando del {first} al {last} de {totalRecords} elementos',
   withOutItems: 'Sin registros.',
   requiredField: 'Este campo es obligatorio.',
   usernameIsRequired: 'El campo Nombre de usuario es obligatorio.',
   passwordIsRequired: 'El campo Contraseña es obligatorio.',
   areYouSureDeleteItemSelected: '¿Está seguro de eliminar el registro seleccionado?',
   fieldsMArketRequired: 'Los campos marcados con * son obligatorios',
   selectColumns: 'Seleccione las columnas',
   emptyMessage: 'No se encontraron registros.',
   selectARow: 'Seleccione una fila',
   yourSessionExpiredLoginAgain: 'Su sesión ha expirado, ingrese nuevamente',
   accessDenied: 'No tiene permisos para realizar esta acción.',
   invalidCredentials: 'Usuario o contraseña incorrectos',
   taskCompletedSuccessfully: 'Acción realizada correctamente',
   areYouSureWantToTakeThisAction: '¿Está seguro de realizar esta acción?',
   welcome: (name: string) => `¡Bienvenido, ${name}!`,
   maxNumberField: (number: number) => `Este campo acepta como máximo ${number} caracteres`,
   minNumberField: (number: number) => `Este campo acepta como mínimo ${number} caracteres`,
} as const;
