import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Interceptor } from '../other/interceptor';
import { NgxStripeModule } from 'ngx-stripe';
import { SocketIoModule } from "ngx-socket-io";

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        IonicModule.forRoot(),
        HttpClientModule,
        NgxStripeModule.forRoot("pk_test_51KNlK6LbfOFI72xW4xnsuE6JQRte49N0HFiLw9mfQn8JF1JuImLOr2QJZewBZwXiPRNgsS6ebeiOisn3Gebp0zLT00i143bkrp"),
        SocketIoModule.forRoot({ url: "https://api.mydomain.com:3000", })
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: Interceptor,
            multi: true,
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
