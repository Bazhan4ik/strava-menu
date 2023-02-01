import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ImageCroppedEvent, ImageCropperModule } from 'ngx-image-cropper';

@Component({
    selector: 'app-image',
    templateUrl: './image.modal.html',
    styleUrls: ['./image.modal.scss'],
    standalone: true,
    imports: [MatIconModule, CommonModule, ImageCropperModule]
})
export class ImageModal {

    base64: string;

    imageEvent: any;

    showInput = true;

    @Output() leave = new EventEmitter();
    

    onFileChange(ev: any) {
        this.imageEvent = ev;
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
