import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddDishPage } from './add-dish.page';

const routes: Routes = [
    {
        path: "",
        component: AddDishPage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AddDishRoutingModule { }
