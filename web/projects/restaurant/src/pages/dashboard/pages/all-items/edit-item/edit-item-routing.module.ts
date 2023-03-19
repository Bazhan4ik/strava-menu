import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditItemPage } from './edit-item.page';

const routes: Routes = [
    {
        path: "",
        component: EditItemPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class EditItemRoutingModule { }
