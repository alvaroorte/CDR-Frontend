import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '@core/pipes/pipes.module';
import { PrimeModules } from '@shared/prime-components/prime-components.module';

@NgModule({
    exports: [PipesModule, PrimeModules, ReactiveFormsModule, FormsModule]
})
export class UserModule { }
