import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanQrCodeModal } from './scan-qr-code.modal';

describe('ScanQrCodeModal', () => {
    let component: ScanQrCodeModal;
    let fixture: ComponentFixture<ScanQrCodeModal>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ScanQrCodeModal]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ScanQrCodeModal);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
