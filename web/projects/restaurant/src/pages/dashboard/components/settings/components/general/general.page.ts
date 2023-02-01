import { Component, ViewChild, ViewContainerRef, ChangeDetectorRef, OnInit } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

@Component({
    selector: 'app-general',
    templateUrl: './general.page.html',
    styleUrls: ['./general.page.scss']
})
export class GeneralPage implements OnInit {
    newName: string;

    restaurant: { name: string; description: string; };

    edit = {
        basic: false,
    }

    constructor(
        private changeDetector: ChangeDetectorRef,
        private service: RestaurantService,
    ) {}


    @ViewChild("nameEditContainer", { read: ViewContainerRef }) nameEditContainer: ViewContainerRef;

    async editBasic() {
        this.edit.basic = true;

        this.changeDetector.detectChanges();

        const { NameContainer } = await import("./edit-containers/name/name.container");

        const component = this.nameEditContainer.createComponent(NameContainer);

        component.instance.name = this.restaurant.name;
        component.instance.description = this.restaurant.description;

        component.instance.leave.subscribe(async (data: { name: string; description: string; }) => {
            if(data) {

                const update: any = await this.service.put({ name: data.name.trim(), description: data.description.trim() }, "settings/general");

                if(update.updated) {
                    this.restaurant.name = data.name;
                    this.restaurant.description = data.description;

                    this.changeDetector.detectChanges();
                } else {
                    // show modal
                }
            }
            component.destroy();
            
            this.editBasicClose();
        });
    }

    editBasicClose() {
        this.edit.basic = false;
    }

    async ngOnInit() {
        const result: { name: string; description: string; } = await this.service.get("settings/general");

        console.log(result);

        this.restaurant = result;
    }
}
