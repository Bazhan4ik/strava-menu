import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeInputModule } from 'angular-code-input';
import { EmailVerificationRoutingModule } from './email-verification-routing.module';
import { EmailVerificationPage } from './email-verification.page';


@NgModule({
  declarations: [
    EmailVerificationPage,
  ],
  imports: [
    CommonModule,
    CodeInputModule,
    EmailVerificationRoutingModule
  ]
})
export class EmailVerificationModule { }
