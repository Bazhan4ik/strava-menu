import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
    selector: 'app-orders',
    templateUrl: './orders.popover.html',
    styleUrls: ['./orders.popover.scss'],
    standalone: true,
    imports: [CommonModule,]
})
export class OrdersPopover implements OnInit, AfterViewInit {

    @ViewChild("popover") popover: ElementRef<HTMLDivElement>;
    @Input() position: { top: number; left: number; };
    @Input() sessions: { status: string; amount: number; connected: string; }[];


    ngAfterViewInit() {
        const div = this.popover.nativeElement;

        div.style.top = `${this.position.top}px`;
        div.style.left = `${this.position.left}px`;
    }

    ngOnInit() {

    }
}
