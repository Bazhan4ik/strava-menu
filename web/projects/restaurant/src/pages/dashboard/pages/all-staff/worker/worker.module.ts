import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkerRoutingModule } from './worker-routing.module';
import { WorkerPage } from './worker.page';
import { MatIconModule } from '@angular/material/icon';
import { WorkerSettingsComponent } from '../../all-staff/worker-settings/worker-settings.component';
import { DayOfWeekPipe } from './pipe/day.pipe';


@NgModule({
    declarations: [
        WorkerPage,
        DayOfWeekPipe,
    ],
    imports: [
        CommonModule,
        WorkerRoutingModule,
        MatIconModule,
        WorkerSettingsComponent,
    ]
})
export class WorkerModule { }
