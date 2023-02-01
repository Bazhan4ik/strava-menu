import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Interceptor } from '../other/interceptor';
import { NgxStripeModule } from 'ngx-stripe';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        IonicModule.forRoot(),
        HttpClientModule,
        NgxStripeModule.forRoot("pk_live_51KNlK6LbfOFI72xWRXoAtn8SftvASaSDw25bxr6vNYfKqkGf5LkJlyS9Thj5Y2mEFZuJMbDOwlIYA8MNyoowX2tg00Mkv9wgP9"),
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
