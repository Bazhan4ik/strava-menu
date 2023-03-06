import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';
import { DragAndDropModule } from 'projects/restaurant/src/other/drag-and-drop/drag-and-drop.module';

@Component({
    selector: 'app-image',
    templateUrl: './image.modal.html',
    styleUrls: ['./image.modal.scss'],
    standalone: true,
    imports: [MatIconModule, CommonModule, ImageCropperModule, DragAndDropModule]
})
export class ImageModal {

    base64: string;

    currentFile: any;

    showInput = true;

    @Output() leave = new EventEmitter();
    

    onFileChange(ev: any) {
        if(ev instanceof Event) {
            this.currentFile = (ev.target as HTMLInputElement).files?.item(0);
        } else {
            this.currentFile = ev.item(0);
        }

        this.showInput = false;
    }


    imageCropped(ev: ImageCroppedEvent) {
        if(ev.base64) {
            this.base64 = ev.base64;
        }
    }

    save() {
        this.leave.emit(this.base64);
    }

    close() {
        this.leave.emit();
    }

}
