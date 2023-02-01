import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedInGuard } from '../guards/logged-in.guard';
import { LoggedOutGuard } from '../guards/logged-out.guard';

const routes: Routes = [
    {
        path: "",
        pathMatch: "full",
        redirectTo: "home",
    },
    {
        path: "home",
        loadChildren: () => import("./../pages/home/home.module").then(m => m.HomeModule),
        canActivate: [LoggedInGuard],
    },
    {
        path: "login",
        loadChildren: () => import("./../pages/login/login.module").then(m => m.LoginModule),
        canActivate: [LoggedOutGuard],
    },
    {
        path: "register",
        loadChildren: () => import("./../pages/register/register.module").then(m => m.RegisterModule),
        canActivate: [LoggedOutGuard],
    },
    {
        path: "verification",
        loadChildren: () => import("./../pages/email-verification/email-verification.module").then(m => m.EmailVerificationModule),
        canActivate: [LoggedInGuard]
    },
    {
        path: "add-restaurant",
        loadChildren: () => import("./../pages/add-restaurant/add-restaurant.module").then(m => m.AddRestaurantModule),
        canActivate: [LoggedInGuard],
    }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
