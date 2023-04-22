import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
    selector: '[resizing]',
})
export class ResizingDirective {
    constructor(private elementRef: ElementRef) { };


    private isGrabbing = false;
    private start: number;
    private resizeLeft = true;
    private resizeRight = true;


    @Output() blocksChange = new EventEmitter();
    @Input() amountOfBlocks: number;



    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent): void {
        if (event.button === 0) { // left mouse button
            this.start = event.clientX;
            event.preventDefault();
            this.isGrabbing = true;
            this.elementRef.nativeElement.style.cursor = 'e-resize';
        }
    }




    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        if (this.isGrabbing && (this.start || this.start === 0)) {
            const parent = (this.elementRef.nativeElement as HTMLDivElement).parentElement;
            const parentOfParent = parent?.parentElement;
            const changeStart = event.clientX;

            if(!parent || !parentOfParent) {
                return;
            }


            // offsetLeft is the position of the element relative to the parent element
            // offsetWidth is the width of the element
            // offsetLeft + offsetWidth is the position of the right side of the element


            // position of the parent element relative to the whole screen
            // const parentLeft = parentOfParent.offsetLeft + 17;

            // position of the grabbed div relative to the parent element
            // const newSelectedPosition = event.clientX - parentLeft;

            // find the closest div to the grabbed div
            // const closestElement = this.findClosestElement(parentOfParent.children.namedItem("times")?.children!, newSelectedPosition);

            if(event.clientX - this.start > 23 && this.resizeRight) {
                // adding, going right
                this.amountOfBlocks++;
                this.blocksChange.emit(this.amountOfBlocks);
            } else if(event.clientX - this.start < -23 && this.resizeLeft) {
                // removing, going left
                this.amountOfBlocks--;
                this.blocksChange.emit(this.amountOfBlocks);

                if(this.amountOfBlocks == 1) {
                    this.resizeLeft = false;
                }
            }

            if(parent.offsetWidth == 23 || parent.offsetWidth == 46) {
                this.resizeLeft = false;
            } else {
                this.resizeLeft = true;
            }

            if(!(event.clientX - this.start < -23 && event.clientX - this.start > -46) && !(event.clientX - this.start > 23 && event.clientX - this.start < 46)) {
                return;
            }

            this.start = changeStart;

            let width = 0;
            let lastIndex = 0;
            for(let i = 0; i < parentOfParent.children.namedItem("times")?.children.length!; i++) {
                const element = parentOfParent.children.namedItem("times")?.children[i] as HTMLDivElement;

                if(element.offsetLeft < parent.offsetLeft) {
                    continue;
                }

                lastIndex = lastIndex || i + this.amountOfBlocks;

                if(element.offsetLeft > parent.offsetLeft + parent.offsetWidth || i >= lastIndex) {
                    break;
                }

                width += element.offsetWidth;
            }

            parent.style.width = width + "px";
        }
    }





    @HostListener('document:mouseup')
    onMouseUp(): void {
        this.isGrabbing = false;
        this.elementRef.nativeElement.style.cursor = 'e-resize';
    }






    /**
     * 
     * @param elements  collection of divs
     * @param position  position of the grabbed div
     * 
     * the function find the closest div to the grabbed div by comparing the position of the grabbed div with the position of the other divs
     */
    findClosestElement(elements: HTMLCollection, position: number): HTMLDivElement {
        let closest = 0;

        for (let i = 1; i < elements.length; i++) {
            const element = elements[i] as HTMLDivElement;
            if(element.classList.contains("selected") || element.offsetWidth > position) {
                continue;
            }
            if (Math.abs(position - element.offsetLeft) < Math.abs(position - (elements[closest] as HTMLDivElement).offsetLeft)) {
                closest = i;
            }
        }

        return elements[closest] as HTMLDivElement;
    }
}
