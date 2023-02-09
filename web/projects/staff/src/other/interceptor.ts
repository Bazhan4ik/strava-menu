import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { env } from 'environment/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private cookieService: CookieService,
        private router: Router,
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        const token = this.cookieService.get('smjwt');
        
        if(req.method == "JSONP") {
            return next.handle(req);
        }

        const request = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + token),
            withCredentials: true,
        });

        return next.handle(request).pipe(
            catchError((err: HttpErrorResponse) => {


                if(err.status == 401 || err.error.reason == "TokenInvalid" || err.error.reason == "AccountNotFound") {
                    this.cookieService.delete("smjwt");
                    window.location.href = env.accountUrl + "/login";
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