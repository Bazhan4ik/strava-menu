import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ItemPage } from './item.page';

const routes: Routes = [
    {
        path: "",
        component: ItemPage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ItemRoutingModule { }
