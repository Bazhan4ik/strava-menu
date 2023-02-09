import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { env } from 'environment/environment';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {

    qrurl: string;
    downloadUrl: any;

    constructor(
        private service: RestaurantService,
    ) { };

    setDownloadUrl(e: any) {
        this.downloadUrl = e;
        this.sendUrl.emit(this.downloadUrl.changingThisBreaksApplicationSecurity);
    }


    @Input() locationId: string;
    @Input() table: { id: number; _id: string; orders: number; };
    @Output() sendUrl = new EventEmitter();



    print() {
        const popupWin = window.open('', '_blank', 'top=0,left=0,height=100%,width=auto');
        if (popupWin) {
            popupWin.document.open();
            popupWin.document.write(`
				<html>
					<head>
						<title>StravaMenu</title>
						<style type="text/css">
                            img {
                                width: 214px;
                                height: 214px;
                            }
                        </style>
                    </head>
                    <body onload="window.print();window.close()">
                        <img src=${this.downloadUrl.changingThisBreaksApplicationSecurity} />
                    </body>
                </html>
            `);
            popupWin.document.close();
        }
    }


    ngOnInit() {
        this.qrurl = `${env.customerUrl}/${this.service.restaurant.id}/${this.locationId}?table=${this.table._id}`;
    }
}
