import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmailComponent } from './email/email.component';
import { OptionsComponent } from './options/options.component';
import { RegisterPage } from './register.page';

const routes: Routes = [
    {
        path: "",
        component: RegisterPage,
        children: [
            {
                path: "",
                component: OptionsComponent,
            },
            {
                path: "email",
                component: EmailComponent,
            }
        ]
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegisterRoutingModule { }
