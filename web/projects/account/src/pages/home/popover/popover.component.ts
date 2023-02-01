import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-popover',
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.scss']
})
export class PopoverComponent implements AfterViewInit {

    customerLink = "";

    @Input() position: { right: number; bottom: number; };
    @Output() leave = new EventEmitter();
    @ViewChild("popover") popover: ElementRef;


    close() {
        this.leave.emit(false);
    }

    logout() {
        this.leave.emit(true);
    }


    ngAfterViewInit(): void {
        console.log(this.position);
        this.popover.nativeElement.style.position = "absolute";
        this.popover.nativeElement.style.top = `${ this.position.bottom }px`;
        this.popover.nativeElement.style.left = `${ this.position.right - 200 /* width of the button */ }px`;
    }

}
