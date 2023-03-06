import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DishPage } from './dish.page';

const routes: Routes = [
    {
        path: "",
        component: DishPage,
        children: [

        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DishRoutingModule { }
