import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddLocationPage } from './add-location.page';

const routes: Routes = [
    {
        path: "",
        component: AddLocationPage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AddLocationRoutingModule { }
