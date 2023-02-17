import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { SocketService } from '../services/socket.service';
import { StaffService } from '../services/staff.service';

@Injectable({
  providedIn: 'root'
})
export class LocationIdGuard implements CanActivate {
    constructor(
        private service: StaffService,
        private socket: SocketService,
    ) {}


    async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {

        const locationId = route.paramMap.get("locationId");

        if(!locationId) {
            return false;
        }

        const socketId = await this.socket.socketId();

        const result: any = await this.service.addLocationAndJoinRooms(socketId, locationId);

        if(!result) {
            return false;
        }

        console.log("LOCATION SET");

        this.service.restaurant.pages = result.pages;
        this.service.restaurant.redirectTo = result.redirectTo;
        this.service.locationId = locationId;
        this.service.userId = result.userId;

        return true;
    }
}
