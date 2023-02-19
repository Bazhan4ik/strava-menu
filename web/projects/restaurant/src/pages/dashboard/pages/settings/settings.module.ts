import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsPage } from './settings.page';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
    declarations: [
        SettingsPage,
    ],
    imports: [
        CommonModule,
        SettingsRoutingModule,
        MatIconModule,
    ]
})
export class SettingsModule { }
