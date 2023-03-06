import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddFolderPage } from './add-folder.page';

const routes: Routes = [
    {
        path: "",
        component: AddFolderPage,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AddFolderRoutingModule { }
