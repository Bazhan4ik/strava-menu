import { CommonModule } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit, ViewChild, ViewContainerRef, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { Subscription } from 'rxjs';
import { CollectionComponent } from '../../components/collection/collection.component';
import { Dish } from '../../models/dish';

@Component({
    selector: 'app-full-dish',
    templateUrl: './full-dish.page.html',
    styleUrls: ['./full-dish.page.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule, CollectionComponent],
})
export class FullDishPage implements OnInit, OnDestroy {

    image: string;

    dish: Dish;

    amount: number = 0;

    collection: any;

    subscription: Subscription;

    constructor(
        private service: CustomerService,
        private router: Router,
        private route: ActivatedRoute,
        private injector: Injector,
    ) {
        this.subscription = this.router.events.subscribe(ev => {
            if(ev instanceof NavigationEnd) {
                if(this.dish) {
                    const dishId = ev.url.split("?")[0].split("/")[3];
    
                    if(this.dish.id != dishId) {
                        this.amount = 0;
                        this.dish = null!;
                        this.collection = null!;
                        this.ngOnInit();
                    }
                }
            }
        });
    };

    @ViewChild("modalContainer", { read: ViewContainerRef }) modalContainer: ViewContainerRef;


    async add(comment: string = null!) {
        const result: { insertedId: string; } = await this.service.post({ comment, dishId: this.dish._id }, "session", "dish");

        if(result.insertedId) {
            this.amount++;

            this.service.session.dishes.push({
                _id: result.insertedId,
                dishId: this.dish._id,
                comment: comment,
            });
        }

    }
    
    async comment() {
        const { CommentModal } = await import("./../../components/comment/comment.modal");
        
        const component = this.modalContainer.createComponent(CommentModal, { injector: this.injector,  });
     
        
        component.instance.leave.subscribe((comment: string) => {
            if(comment) {
                this.add(comment);
            }
            component.destroy();
        });
    }


    async ngOnInit() {
        const dishId = this.route.snapshot.paramMap.get("dishId");
        const collectionId = this.route.snapshot.queryParamMap.get("c"); // collection id where the dish was redirected from. used to show more dishes from that collection

        if(!dishId) {
            return this.router.navigate([this.service.restaurant.id, this.service.locationId]);
        }

        let result: {
            dish: any;
            collection: any[];
        } = null!;

        try {
            result = await this.service.get({ c: collectionId || undefined! }, "dishes", dishId!);
        } catch (e: any) {
            if(e.status == 404) {
                if(e.error.reason == "DishNotFound") {
                    this.router.navigate([this.service.restaurant.id, this.service.locationId]);
                    return;
                }
            }
        }


        if(result.dish.images) {
            this.image = getImage(result.dish.images[0]?.buffer);
        } else {
            this.image = "./../../../../../../../global-resources/images/no-image.svg";
        }

        console.log(result);

        for(let dish of this.service.session.dishes) {
            if(dish.dishId == result.dish._id) {
                this.amount++;
            }
        }

        this.dish = result.dish;

        this.collection = result.collection;


        return;
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

}
