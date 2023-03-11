import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TablesQrCodesPage } from './tables-qr-codes.page';

const routes: Routes = [
    {
        path: "",
        component: TablesQrCodesPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TablesQrCodesRoutingModule { }
