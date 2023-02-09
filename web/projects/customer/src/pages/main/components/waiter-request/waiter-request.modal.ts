import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { Subscription } from 'rxjs';
import { Session } from '../../models/session';
import { WaiterRequestEvent } from '../../models/socket';

@Component({
    selector: 'app-waiter-request',
    templateUrl: './waiter-request.modal.html',
    styleUrls: ['./waiter-request.modal.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class WaiterRequestModal implements OnInit, OnDestroy {

    subscription: Subscription;

    constructor(
        private service: CustomerService,
    ) {}


    @Input() request: Session["waiterRequest"];
    @Output() leave = new EventEmitter();


    async cancel() {
        const update: any = await this.service.put({ requestId: this.request._id }, "session/request/cancel");

        if(update.updated) {
            this.leave.emit();
        }


    }

    ngOnInit() {
        this.subscription = this.service.$waiterRequest.subscribe(res => {
            console.log(res);
            if(res.types.includes("request/accept")) {
                if(this.request._id == (res.data as WaiterRequestEvent.accept).requestId) {
                    this.request.accepted = res.data.time;
                    this.request.waiter = res.data.waiter;
                }
            } else if(res.types.includes("request/quit")) {
                if(this.request._id == (res.data as WaiterRequestEvent.cancel).requestId) {
                    this.request.accepted = null!;
                    this.request.waiter = null!;
                }
            } else if(res.types.includes("request/resolve")) {
                if(this.request._id == (res.data as WaiterRequestEvent.cancel).requestId) {
                    this.leave.emit(this.request.reason == "cash");
                }
            }
        })
    }
    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

}
