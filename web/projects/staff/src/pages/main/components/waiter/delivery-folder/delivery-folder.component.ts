import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, } from '@angular/core';
import { ConvertedSessionItem } from 'projects/staff/src/models/order-items';
import { StaffService } from 'projects/staff/src/services/staff.service';

@Component({
    selector: 'app-delivery-folder',
    templateUrl: './delivery-folder.component.html',
    styleUrls: ['./delivery-folder.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class DeliveryFolderComponent implements OnInit {
    constructor(
        private service: StaffService,
    ) { };


    @Input() folder: { deliveryStatus: string; canBePickedUp: boolean; items: ConvertedSessionItem[]; id: string; };



    async ngOnInit() {
        const result: any = await this.service.get("waiter/delivery-status", this.folder.items[0].sessionId);

        this.folder.deliveryStatus = result.deliveryStatus;
        this.folder.canBePickedUp = result.showPickedUpButton;
    }

}
