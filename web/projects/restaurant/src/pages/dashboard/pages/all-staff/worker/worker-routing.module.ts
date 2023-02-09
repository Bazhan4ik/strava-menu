import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkerPage } from './worker.page';

const routes: Routes = [
    {
        path: "",
        component: WorkerPage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WorkerRoutingModule { }
