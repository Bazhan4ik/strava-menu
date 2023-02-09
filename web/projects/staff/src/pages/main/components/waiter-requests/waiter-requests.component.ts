import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { WaiterRequest } from 'projects/staff/src/models/waiter-request';
import { WaiterRequestData } from 'projects/staff/src/models/waiter-request-socket';
import { SocketService } from 'projects/staff/src/services/socket.service';
import { StaffService } from 'projects/staff/src/services/staff.service';

@Component({
    selector: 'app-waiter-requests',
    templateUrl: './waiter-requests.component.html',
    styleUrls: ['./waiter-requests.component.scss']
})
export class WaiterRequestsComponent implements OnInit {


    requests: WaiterRequest[];


    constructor(
        private socket: SocketService,
        private service: StaffService,
        private changeDetector: ChangeDetectorRef,
    ) { };


    onRequestResolved(id: string) {
        for(let i in this.requests) {
            if(this.requests[i]._id == id) {
                this.requests.splice(+i, 1);
                break;
            }
        }
    }


    async ngOnInit() {
        this.socket.$waiterRequests.subscribe(res => {
            if(res.types.includes("request/new")) {
                this.requests.push(res.data as WaiterRequestData.add);
            } else if(res.types.includes("request/cancel")) {
                const { sessionId, requestId } = res.data as WaiterRequestData.other;

                for(let i in this.requests) {
                    if(this.requests[i]._id == requestId) {
                        this.requests.splice(+i, 1);
                        break;
                    }
                }
            } else if(res.types.includes("request/accept")) {
                const { user, requestId, time } = res.data as WaiterRequestData.accept;

                for(let request of this.requests) {
                    if(request._id == requestId) {
                        request.acceptedTime = time;
                        request.waiter = {
                            name: user.name,
                            avatar: getImage(user.avatar) || "./../../../../../../../global-resources/images/plain-avatar.jpg",
                        };
                        request.acceptedTimeout = setTimeout(() => {
                            request.acceptedTime.minutes++;
                            if(request.acceptedTime.minutes == 60) { request.acceptedTime.hours++; request.acceptedTime.minutes = 0; };
                            request.acceptedInterval = setInterval(() => {
                                request.acceptedTime.minutes++;
                                if(request.acceptedTime.minutes == 60) { request.acceptedTime.hours++; request.acceptedTime.minutes = 0; };
                            }, 60000);
                        }, time.nextMinute);
                        
                        break;
                    }
                }
            } else if(res.types.includes("request/quit")) {
                const { requestId } = res.data as WaiterRequestData.quit;

                for(let request of this.requests) {
                    if(request._id == requestId) {
                        clearInterval(request.acceptedInterval);
                        clearTimeout(request.acceptedTimeout);

                        request.acceptedTime = null!;
                        request.waiter = null!;
                        break;
                    }
                }
            } else if(res.types.includes("request/resolve")) {
                const { requestId } = res.data as WaiterRequestData.resolve;
                
                for(let i in this.requests) {
                    if(this.requests[i]._id == requestId) {
                        this.requests.splice(+i, 1);
                        break;
                    }
                }
            }
        });



        const result: WaiterRequest[] = await this.service.get("waiter/requests");

        this.requests = result;

        console.log(result);
    }

}
