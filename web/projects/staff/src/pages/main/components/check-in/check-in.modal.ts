import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { StaffService } from 'projects/staff/src/services/staff.service';

@Component({
    selector: 'app-check-in',
    templateUrl: './check-in.modal.html',
    styleUrls: ['./check-in.modal.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class CheckInModal implements OnInit {
    constructor(private service: StaffService) { };




    ngOnInit() {
        
    }
}
