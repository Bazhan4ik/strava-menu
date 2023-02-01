import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class Interceptor implements HttpInterceptor {

    constructor(
        private cookieService: CookieService,
        private router: Router,
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        
        if(req.method == "JSONP") {
            return next.handle(req);
        }
        
        const token = this.cookieService.get('smjwt');
        const sessionId = this.cookieService.get("smsid");

        const request = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + token).set("User-Session-Id", sessionId),
            withCredentials: true,
        });

        return next.handle(request).pipe(
            catchError((err: HttpErrorResponse) => {


                if(err.status == 401 || err.error.reason == "TokenInvalid" || err.error.reason == "AccountNotFound") {
                    this.cookieService.delete("smjwt");
                    this.router.navigate(["login"]);
                } else if(err.status == 403) {
                    if(err.error.reason == "RestrictedAccount") {
                        this.router.navigate(["verification"]);
                    }
                }

                return throwError(() => { return { status: err.status, error: err.error } });
            })
        );
    }
}