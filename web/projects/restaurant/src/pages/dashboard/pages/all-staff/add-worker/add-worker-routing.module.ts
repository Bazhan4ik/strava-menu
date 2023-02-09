import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddWorkerPage } from './add-worker.page';
import { ConfigurePage } from './configure/configure.page';
import { SearchPage } from './search/search.page';

const routes: Routes = [
    {
        path: "",
        component: AddWorkerPage,
        children: [
            {
                path: "",
                component: SearchPage,
            },
            {
                path: ":userId",
                component: ConfigurePage,
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AddWorkerRoutingModule { }
