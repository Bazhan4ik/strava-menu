import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FolderRoutingModule } from './folder-routing.module';
import { MatIconModule } from '@angular/material/icon';
import { FolderPage } from './folder.page';


@NgModule({
    declarations: [
        FolderPage,
    ],
    imports: [
        CommonModule,
        FolderRoutingModule,
        MatIconModule,
    ]
})
export class FolderModule { }
