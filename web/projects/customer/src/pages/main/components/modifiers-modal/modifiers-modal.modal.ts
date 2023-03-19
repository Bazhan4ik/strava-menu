import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter, ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CustomerService } from 'projects/customer/src/services/customer.service';
import { Modifier } from '../../models/item';
import { ModifiersComponent } from '../modifiers/modifiers.component';

@Component({
    selector: 'app-modifiers-modal',
    templateUrl: './modifiers-modal.modal.html',
    styleUrls: ['./modifiers-modal.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class ModifiersModalModal implements OnInit {
    
    modifiers: Modifier[];
    selected: any;

    component: ComponentRef<ModifiersComponent>;

    constructor(
        private service: CustomerService,
    ) { };


    @Input() itemId: string;
    @Input() sessionItemId: string;
    @Output() leave = new EventEmitter();

    @ViewChild("container", { read: ViewContainerRef }) container: ViewContainerRef;





    close() {
        this.leave.emit();
    }
    save() {
        const modifiers = this.component.instance.getModifiers();

        if(!modifiers) {
            return;
        }

        this.leave.emit(modifiers);
    }


    async ngOnInit() {
        const result: any = await this.service.get({ itemId: this.itemId, sessionItemId: this.sessionItemId }, "modifiers");

        
        this.modifiers = result.modifiers;
        this.selected = result.selected;

        this.component = this.container.createComponent(ModifiersComponent);

        this.component.instance.modifiers = this.selected;

    }

}
