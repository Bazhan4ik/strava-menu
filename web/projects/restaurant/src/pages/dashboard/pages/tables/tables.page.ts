import { Component, OnInit } from '@angular/core';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';


interface Table {
    id: number;
    _id: string;
    orders: number;
}
interface Location {
    locationName: string;
    locationId: string;
    tables: Table[];
}


@Component({
    selector: 'app-tables',
    templateUrl: './tables.page.html',
    styleUrls: ['./tables.page.scss']
})
export class TablesPage implements OnInit {

    locations: Location[];

    downloadUrls: { locationId: string; tableId: number; url: string; }[] = [];

    constructor(
        private service: RestaurantService,
    ) { };


    async addTable(locationId: string) {
        const result: any = await this.service.post({ locationId }, "tables");

        if(result.updated) {
            for(let l of this.locations) {
                if(l.locationId == locationId) {
                    l.tables.push(result.table);
                }
            }
        }
    }

    addDownloadUrl(locationId: string, tableId: number, url: string) {
        this.downloadUrls.push({ locationId, tableId, url });
    }

    async removeTable(locationId: string) {
        const result: any = await this.service.delete("tables", locationId);

        if(result.updated) {
            for(let l of this.locations) {
                if(l.locationId == locationId) {
                    l.tables.splice(l.tables.length - 1, 1);
                    break;
                }
            }
        }
    }


    printAll() {
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

                            .table {
                                margin-top: 32px;
                                width: 214px;
                                height: auto;
                            }

                            .title {
                                width: 100%;
                                height: 30px;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                font-size: 26px;
                                font-weight: 600;
                                color: black;
                            }

                            .tables {
                                width: 100vw;
                                min-height: 100vh;
                                display: flex;
                                gap: 24px;
                                flex-wrap: wrap;
                            }

                        </style>
                    </head>
                    <body onload="window.print();window.close()">
                        <div class="tables">
                            ${this.downloadUrls.map(a => (`
                                <div class="table">
                                    <div class="title">
                                        Table #${a.tableId}
                                    </div>
                                    <img src=${a.url} />
                                </div>
                            `)).join("")}
                        </div>
                    </body>
                </html>
            `);
            popupWin.document.close();
        }
    }

    async ngOnInit() {
        const tables: Location[] = await this.service.get("tables");

        this.locations = tables || [];
        console.log(tables);
    }
}