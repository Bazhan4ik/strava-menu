import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditDishPage } from './edit-dish.page';

const routes: Routes = [
    {
        path: "",
        component: EditDishPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class EditDishRoutingModule { }
