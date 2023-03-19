import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddItemPage } from './add-item.page';

const routes: Routes = [
    {
        path: "",
        component: AddItemPage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AddItemRoutingModule { }
