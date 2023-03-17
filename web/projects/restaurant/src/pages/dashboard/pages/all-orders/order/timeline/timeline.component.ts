import { Component, Input, OnInit } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

interface Timeline {
    description: string;
    color: string;
    time: string;
}

@Component({
    selector: 'app-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss'],
})
export class TimelineComponent implements OnInit {

    timeline: Timeline[];

    constructor(
        private service: RestaurantService,
    ) { };

    @Input() orderId: string;



    async ngOnInit() {


        const result: { timeline: Timeline[]; } = await this.service.get("orders", this.orderId, "timeline");

        this.timeline = result.timeline;

        console.log(result);

    
    }

}
