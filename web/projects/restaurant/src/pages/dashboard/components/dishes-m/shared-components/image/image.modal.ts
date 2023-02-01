import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { ImageCropperModule } from 'ngx-image-cropper';

@Component({
    selector: 'app-image',
    templateUrl: './image.modal.html',
    styleUrls: ['./image.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule, ImageCropperModule]
})
export class ImageModal {

    imageEvent: any;
    showInput = true;
    image: string;

    @Output() leave = new EventEmitter();

    close() {
        this.leave.emit();
    }

    onFileChange(ev: any) {
        this.imageEvent = ev;
        this.showInput = false;
    }

    changeImage() {
        this.showInput = true;
        this.imageEvent = null!;
    }

    imageCropped(data: ImageCroppedEvent) {
        if(data.base64) {
            this.image = data.base64;
        }
    }

    save() {
        this.leave.emit(this.image);
    }
}
