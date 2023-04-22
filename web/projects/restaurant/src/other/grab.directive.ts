import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { ResizingDirective } from './width-resize.directive';

@Directive({
    selector: '[grabbing]',
})
export class GrabbingDirective {
    constructor(private elementRef: ElementRef) { }


    private isGrabbing = false;
    private start: number;


    @Input() amountBlocksFromStart: number;
    @Input() amountOfBlocks: number;
    @Output() moved = new EventEmitter();



    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent): void {
        if (event.button === 0) { // left mouse button
            event.preventDefault();
            this.start = event.clientX;
            this.isGrabbing = true;
            this.elementRef.nativeElement.style.cursor = 'grabbing';
        }
    }




    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        if (this.isGrabbing) {
            const parent = (this.elementRef.nativeElement as HTMLDivElement).parentElement;
            const times = parent?.children.namedItem("times")?.children;
            const selected = this.elementRef.nativeElement as HTMLDivElement;
            const scrollingElement = parent?.parentElement?.parentElement;

            if(!parent || !times || !scrollingElement) {
                return;
            }


            // element is being grabbed
            // element should be moved to a side
            // element's width should be changed

            if(this.start < event.clientX - 23) {
                // element was moved to the right

                // set start to the current position
                this.start = event.clientX;

                
                // find closest element to the right
                const { element: closestElement, index: closestElementIndex } = this.findClosestElement(times, event.clientX - parent.offsetLeft + scrollingElement.scrollLeft);

                if(closestElementIndex + this.amountOfBlocks > times.length) {
                    return;
                }

                // now set the position of the element to the position of the closest element
                selected.style.left = `${(closestElement as HTMLDivElement).offsetLeft}px`;

                let width = 0;
                for(let i = closestElementIndex; i < closestElementIndex + this.amountOfBlocks; i++) {
                    const child = times.item(i) as HTMLDivElement;
                    width += child.offsetWidth;
                }

                selected.style.width = `${width}px`;
                this.amountBlocksFromStart = closestElementIndex;
                this.moved.emit(this.amountBlocksFromStart);
            } else if(this.start > event.clientX + 23) {
                // element was moved to the left

                // set start to the current position
                this.start = event.clientX;

                // find closest element to the left
                const { element: closestElement, index: closestElementIndex } = this.findClosestElement(times, event.clientX - parent.offsetLeft + scrollingElement.scrollLeft);

                // now set the position of the element to the position of the closest element
                selected.style.left = `${(closestElement as HTMLDivElement).offsetLeft}px`;

                // now calculate the width of the blocks and set it to the selected element
                let width = 0;
                for(let i = closestElementIndex; i < closestElementIndex + this.amountOfBlocks; i++) {
                    const child = times.item(i) as HTMLDivElement;
                    width += child.offsetWidth;
                }

                selected.style.width = `${width}px`;
                this.amountBlocksFromStart = closestElementIndex;
                this.moved.emit(this.amountBlocksFromStart);
            }

        }
    }





    @HostListener('document:mouseup')
    onMouseUp(): void {
        this.isGrabbing = false;
        this.elementRef.nativeElement.style.cursor = 'grab';
    }






    /**
     * 
     * @param elements  collection of divs
     * @param position  position of the grabbed div
     * 
     * the function find the closest div to the grabbed div by comparing the position of the grabbed div with the position of the other divs
     */
    findClosestElement(elements: HTMLCollection, position: number) {
        let closest = 0;

        for (let i = 1; i < elements.length; i++) {
            const element = elements[i] as HTMLDivElement;
            if(element.classList.contains("selected")) {
                continue;
            }
            if (Math.abs(position - element.offsetLeft) < Math.abs(position - (elements[closest] as HTMLDivElement).offsetLeft)) {
                closest = i;
            }
        }

        return { element: elements[closest] as HTMLDivElement, index: closest };
    }
}
