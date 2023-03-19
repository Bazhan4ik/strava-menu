import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';



@Component({
    selector: 'app-menu',
    templateUrl: './menu.page.html',
    styleUrls: ['./menu.page.scss']
})
export class MenuPage implements OnInit {
    constructor(
        private router: Router,
    ) {
        this.router.events.subscribe((ev: any) => {
            if(ev instanceof NavigationEnd) {
                this.currentPage = ev.url.split("/")[3];
            }
        });        
    }

    currentDay: number;
    currentTime: string;
    currentPage: string;


    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;

    async openSorting(type: "day" | "time", data: number | string) {
        const { SortingModal } = await import("./sorting/sorting.modal");

        const component = this.modalContainer.createComponent(SortingModal);   
        
        if(type == "day") {
            component.instance.title = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][data as number];
            component.instance.day = data as number;
        } else if(type == "time") {
            component.instance.title = (data as string)[0].toUpperCase() + (data as string).slice(1, 15);
            component.instance.time = data as string;
        }

        component.instance.leave.subscribe(() => {
            component.destroy();
        });
    }
    
    
    ngOnInit(): void {
        this.currentPage = this.router.url.split("/")[3] || "items";
        const date = new Date();
        this.currentDay = date.getDay();
        
        const hours = date.getHours();
        if(hours >= 17) {
            if(hours > 20) {
                this.currentTime = "night";
            } else {
                this.currentTime = "evening";
            }
        } else if(hours < 17) {
            if(hours < 12) {
                if(hours < 5) {
                    this.currentTime = "night";
                } else {
                    this.currentTime = "morning";
                }
            } else {
                this.currentTime = "afternoon";
            }
        }

    }
}
