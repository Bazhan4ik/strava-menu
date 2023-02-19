import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IngredientsPage } from './ingredients.page';

const routes: Routes = [
    {
        path: "",
        component: IngredientsPage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class IngredientsRoutingModule { }
