import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AddFolderRoutingModule } from './add-folder-routing.module';
import { AddFolderPage } from './add-folder.page';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';


@NgModule({
    declarations: [
        AddFolderPage,
    ],
    imports: [
        CommonModule,
        AddFolderRoutingModule,
        MatIconModule,
        FormsModule,
    ]
})
export class AddFolderModule { }
