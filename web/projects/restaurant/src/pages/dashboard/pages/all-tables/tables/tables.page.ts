import { Component, OnInit, ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';
import { OrdersPopover } from './orders/orders.popover';


interface Table {
    taken: boolean;
    _id: string;
    id: number;
    connected: string;
    total: number;
    sessions: { amount: number; status: string; connected: string; }[];
}


@Component({
    selector: 'app-tables',
    templateUrl: './tables.page.html',
    styleUrls: ['./tables.page.scss']
})
export class TablesPage implements OnInit {

    tables: Table[];

    popover: ComponentRef<OrdersPopover>;
    popoverInstance: OrdersPopover;

    constructor(
        private service: RestaurantService,
        private route: ActivatedRoute,
        private router: Router,
    ) { };

    @ViewChild("popoverContainer", { read: ViewContainerRef }) popoverContainer: ViewContainerRef;
    


    openHover(event: Event, table: Table) {
        const btn = event.target as HTMLButtonElement;
        if(btn.disabled) {
            return;
        }
        const pos = btn.getBoundingClientRect();

        
        this.popover = this.popoverContainer.createComponent(OrdersPopover);
        
        this.popover.instance.position = { left: (pos.left - (228 - pos.width) / 2), top: pos.bottom + 20 };

        this.popover.instance.sessions = table.sessions;

    }

    closePopover(event: any) {
        if(event.target.disabled) {
            return;
        }
        this.popover?.destroy();
    }


    async ngOnInit() {

        const locationId = this.route.snapshot.paramMap.get("locationId");

        if(!locationId) {
            this.router.navigate([this.service.restaurant.id, "tables"]);
            return;
        }

        try {
            const tables: Table[] = await this.service.get("tables", "live", locationId);
    
    
            console.log(tables);

            this.tables = tables;
        } catch (e: any) {
            console.log(e);
            if(e.status == 400 || e.status == 403) {
                this.router.navigate([this.service.restaurant.id, "tables"]);
            }
        }


    }
    
}