import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit, ViewChild, ViewContainerRef, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { env } from 'environment/environment';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { DishesService } from 'projects/customer/src/services/dishes.service';
import { getImage } from 'projects/restaurant/src/utils/getImage';
import { Subscription } from 'rxjs';
import { CollectionComponent } from '../../components/collection/collection.component';
import { Dish } from '../../models/dish';

@Component({
    selector: 'app-full-dish',
    templateUrl: './full-dish.page.html',
    styleUrls: ['./full-dish.page.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, RouterModule, CollectionComponent, NgOptimizedImage],
})
export class FullDishPage implements OnInit, OnDestroy {

    image: string;
    imageUrl: string;

    dish: Dish;

    amount: number = 0;

    collection: any;

    subscription: Subscription;

    constructor(
        private service: CustomerService,
        private router: Router,
        private route: ActivatedRoute,
        private injector: Injector,
        private dishesService: DishesService,
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

        this.imageUrl = env.apiUrl + "/customer/" + this.service.restaurant._id + "/dishes/" + dishId + "/image";

        if(!dishId) {
            return this.router.navigate([this.service.restaurant.id, "recommendations"]);
        }

        if(this.dishesService.dishes) {
            for(let id of Object.keys(this.dishesService.dishes)) {
                if(this.dishesService.dishes[id].id == dishId) {
                    this.dish = this.dishesService.dishes[id];
                    break;
                }
            }
        }


        const result: {
            dish: Dish;
        } = await this.service.get({ collection: collectionId || undefined!, }, "dishes", dishId);

        this.dish = result.dish;
        

        console.log(result)




        return;
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

}
