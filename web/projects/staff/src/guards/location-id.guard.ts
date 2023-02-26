import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
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

        const socketId = await firstValueFrom(
            this.socket.socketId()
        );

        // const result: any = await this.service.addLocationAndJoinRooms(socketId, locationId);
        const result: any = await this.service.init(socketId, locationId);

        if(!result) {
            return false;
        }

        return true;
    }
}
