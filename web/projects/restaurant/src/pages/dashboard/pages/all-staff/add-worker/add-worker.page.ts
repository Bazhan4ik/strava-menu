import { Component } from '@angular/core';

@Component({
    selector: 'app-add-worker',
    templateUrl: './add-worker.page.html',
    styleUrls: ['./add-worker.page.scss']
})
export class AddWorkerPage {
    searchText: string;

    search() {
        console.log(this.searchText);
    }
}
