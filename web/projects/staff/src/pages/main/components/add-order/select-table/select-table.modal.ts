import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StaffService } from 'projects/staff/src/services/staff.service';

interface Table {
    id: number;
    taken: boolean;
    _id: string;
}

@Component({
    selector: 'app-select-table',
    templateUrl: './select-table.modal.html',
    styleUrls: ['./select-table.modal.scss'],
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class SelectTableModal implements OnInit {
    tables: Table[];
    selected?: Table;
    loading: boolean;

    constructor(
        private service: StaffService,
    ) { };


    @Output() leave = new EventEmitter();


    close() {
        this.leave.emit();
    }

    selectTable(table: Table) {
        this.selected = table;
    }

    async save() {
        if(!this.selected) {
            return;
        }
        this.loading = true;

        const result: any = await this.service.put({ tableId: this.selected._id }, "order/table");

        if(result.updated) {
            this.leave.emit(this.selected.id);
        }
    }

    async ngOnInit() {
        const result: Table[] = await this.service.get("order/tables");

        this.tables = result;
    }
}
