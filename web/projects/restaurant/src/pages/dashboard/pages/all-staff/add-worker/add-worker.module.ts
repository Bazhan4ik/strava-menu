import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AddWorkerRoutingModule } from './add-worker-routing.module';
import { AddWorkerPage } from './add-worker.page';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SearchPage } from './search/search.page';
import { ConfigurePage } from './configure/configure.page';
import { IonicModule } from '@ionic/angular';
import { WorkerSettingsComponent } from '../worker-settings/worker-settings.component';


@NgModule({
    declarations: [
        AddWorkerPage,
        SearchPage,
        ConfigurePage,
    ],
    imports: [
        CommonModule,
        AddWorkerRoutingModule,
        MatIconModule,
        FormsModule,
        IonicModule,
        WorkerSettingsComponent,
    ]
})
export class AddWorkerModule { }
