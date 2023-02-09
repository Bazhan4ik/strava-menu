import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Injectable, Injector } from '@angular/core';

@Injectable({
    providedIn: "root",
})
export class SequentialGuardsExecution implements CanActivate {

    constructor(protected router: Router,
        protected injector: Injector) {
    }

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        let guards = route.data["guards"];

        if (!guards) {
            return false;
        }

        for (let guard of guards) {
            const routeGuard = this.injector.get<CanActivate>(guard);

            const toBeResloved = routeGuard.canActivate(route, state);

            if(!(toBeResloved instanceof Promise<boolean>)) {
                console.error("ALL GUARDS HAVE TO RETURN Promise<boolean>");
                return false;
            }


            const result = await toBeResloved;

            if(!result) {
                return false;
            }
        }

        return true;
    }
}