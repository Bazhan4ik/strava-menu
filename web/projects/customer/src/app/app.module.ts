import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Interceptor } from '../other/interceptor';
import { NgxStripeModule } from 'ngx-stripe';
import { SocketIoModule } from "ngx-socket-io";
import { env } from 'environment/environment';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        IonicModule.forRoot(),
        HttpClientModule,
        NgxStripeModule.forRoot(env.stripeKey),
        SocketIoModule.forRoot({ url: env.apiUrl, })
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
