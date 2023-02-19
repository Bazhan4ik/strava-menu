import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import jsqr from 'jsqr';

@Component({
    selector: 'app-scan-qr-code',
    templateUrl: './scan-qr-code.modal.html',
    styleUrls: ['./scan-qr-code.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule]
})
export class ScanQrCodeModal implements OnInit, AfterViewInit {

    cameraAllowed = false;

    stream: MediaStream;

    message: string;


    constructor(
        private changeDetector: ChangeDetectorRef,
    ) {}

    @ViewChild('videoElement') videoElement: ElementRef<HTMLVideoElement>;

    @Output() leave = new EventEmitter();

    async permission() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const result = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });



                console.log(result);

                this.cameraAllowed = true;
                this.stream = result;

                this.changeDetector.detectChanges();

            } catch (error) {
                console.log(error);
            }

        } else {
            console.error('getUserMedia is not supported in this browser');
        }
    }

    close(data?: any) {
        this.leave.emit(data);
        this.stream.getTracks().forEach(t => t.stop());
    }

    onUrlScanned(url: string) {
        const u = new URL(url);

        const table = u.searchParams.get("table");

        if(!table || table.length != 24) {
            this.message = "Invalid QR code";
            this.scanQRCode();
        } else {
            this.close(table);
        }
    }

    scanQRCode() {
        const video = this.videoElement.nativeElement;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if(!context) {
            return;
        }

        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsqr(imageData.data, imageData.width, imageData.height);


        if (code && code.data) {
            this.onUrlScanned(code.data);
        } else {
            // If no QR code was found, schedule the scanQRCode method to
            // be called again
            setTimeout(() => {
                requestAnimationFrame(() => this.scanQRCode());
            }, 500);
        }
    }

    async ngAfterViewInit() {
        await this.permission();

        if(this.cameraAllowed) {

            this.videoElement.nativeElement.srcObject = this.stream;
            this.videoElement.nativeElement.playsInline = true;
            
            await this.videoElement.nativeElement.play();

            requestAnimationFrame(() => {
                if (this.videoElement.nativeElement.readyState === this.videoElement.nativeElement.HAVE_ENOUGH_DATA) {
                    this.scanQRCode();
                }
            });

            return;
        }
        this.permission();
    }

    ngOnInit() {
    }
}
