import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SelectLiveLocationPage } from './select-live-location.page';

const routes: Routes = [
    {
        path: "",
        component: SelectLiveLocationPage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SelectLiveLocationRoutingModule { }
