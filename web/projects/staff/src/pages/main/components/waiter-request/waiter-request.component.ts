import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { WaiterRequest } from 'projects/staff/src/models/waiter-request';
import { StaffService } from 'projects/staff/src/services/staff.service';

@Component({
  selector: 'app-waiter-request',
  templateUrl: './waiter-request.component.html',
  styleUrls: ['./waiter-request.component.scss']
})
export class WaiterRequestComponent implements OnInit, OnDestroy {

    waiterAvatar: string = "./../../../../../../../global-resources/images/plain-avatar.jpg";

    constructor(
        private service: StaffService,
    ) {}

    @Input() request: WaiterRequest;
    @Output() resolved = new EventEmitter();



    async accept() {
        const update: any = await this.service.put({ sessionId: this.request.sessionId, requestId: this.request._id, }, "waiter/requests/accept");

        if(!update.updated) {
            return;
        }

        this.request.ui.acceptedTitle = update.acceptedTitle;
        this.request.acceptedTime = update.delay;
        this.request.waiter = update.waiter;
        this.request.self = true;

        if(update.waiter.avatar) {
            this.waiterAvatar = getImage(update.waiter.avatar);
        }

        this.request.acceptedTimeout = setTimeout(() => {
            this.request.acceptedTime.minutes++;
            if(this.request.acceptedTime.minutes == 60) {
                this.request.acceptedTime.minutes = 0;
                this.request.acceptedTime.hours++;
            }
            this.request.acceptedInterval = setInterval(() => {
                this.request.acceptedTime.minutes++;
                if(this.request.acceptedTime.minutes == 60) {
                    this.request.acceptedTime.minutes = 0;
                    this.request.acceptedTime.hours++;
                }
            }, 60000);   
        }, this.request.acceptedTime.nextMinute);
    }

    async cancel() {
        const update: any = await this.service.put({ sessionId: this.request.sessionId, requestId: this.request._id, }, "waiter/requests/quit");

        if(!update.updated) {
            return;
        }

        this.request.acceptedTime = null!;
        this.request.waiter = null!;
        this.request.self = false;
    }

    async resolve() {
        const update: any = await this.service.put({ sessionId: this.request.sessionId, requestId: this.request._id, }, "waiter/requests/resolve");

        if(!update.updated) {
            return;
        }

        this.resolved.emit();
    }


    ngOnInit() {
        if(!this.request.requestedTime) {
            return;
        }

        this.request.requestedTimeout = setTimeout(() => {
            this.request.requestedTime.minutes++;
            if(this.request.requestedTime.minutes == 60) {
                this.request.requestedTime.minutes = 0;
                this.request.requestedTime.hours++;
            }
            this.request.requestedInterval = setInterval(() => {
                this.request.requestedTime.minutes++;
                if(this.request.requestedTime.minutes == 60) {
                    this.request.requestedTime.minutes = 0;
                    this.request.requestedTime.hours++;
                }
            }, 60000);   
        }, this.request.requestedTime.nextMinute);

        if(this.request.waiter?.avatar) {
            this.waiterAvatar = getImage(this.request.waiter.avatar);
        }
    }
    ngOnDestroy(): void {
        clearInterval(this.request.requestedInterval);
        clearInterval(this.request.acceptedInterval);
        clearTimeout(this.request.requestedTimeout);
        clearTimeout(this.request.acceptedTimeout);
    }
}
