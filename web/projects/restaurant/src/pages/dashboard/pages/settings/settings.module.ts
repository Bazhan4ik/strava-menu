import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsPage } from './settings.page';


@NgModule({
    declarations: [
        SettingsPage,
    ],
    imports: [
        CommonModule,
        SettingsRoutingModule
    ]
})
export class SettingsModule { }
