import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsPage } from './settings.page';

const routes: Routes = [
    {
        path: "",
        component: SettingsPage,
        children: [
            {
                path: "",
                pathMatch: "full",
                redirectTo: "general",
            },
            {
                path: "general",
                loadChildren: () => import("./components/general/general.module").then(m => m.GeneralModule)
            },
            {
                path: "payments",
                loadChildren: () => import("./components/payments/payments.module").then(m => m.PaymentsModule)
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SettingsRoutingModule { }
