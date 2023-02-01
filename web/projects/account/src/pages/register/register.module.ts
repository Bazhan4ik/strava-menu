import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";
import { RegisterRoutingModule } from './register-routing.module';
import { RegisterPage } from './register.page';
import { OptionsComponent } from './options/options.component';
import { EmailComponent } from './email/email.component';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
    declarations: [
        RegisterPage,
        OptionsComponent,
        EmailComponent,
    ],
    imports: [
        CommonModule,
        RegisterRoutingModule,
        MatIconModule,
        ReactiveFormsModule
    ]
})
export class RegisterModule { }
