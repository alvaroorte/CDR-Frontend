import { AbstractControl, ValidationErrors } from '@angular/forms';

export function noSpaceValidator(control: AbstractControl): ValidationErrors | null {
    let valid = true;
    if (control.value && control.dirty) {
        valid = control.value.length != 0 && control.value.trim().length > 0? true: false
    }
    return valid? null: { noSpace: true };
}