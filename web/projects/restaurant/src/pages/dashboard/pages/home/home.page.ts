import { Component, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, ChartEvent, ChartType } from 'chart.js';
// import { default as Annotation } from 'chartjs-plugin-annotation';
import { BaseChartDirective } from 'ng2-charts';
import { RestaurantService } from 'projects/restaurant/src/services/restaurant.service';


@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {


    lineChartData: ChartConfiguration['data'] = {
        datasets: [
            // {
            //     data: [null, null, 80, 81, 56, 55, 40],
            //     // label: 'This week',
            //     borderColor: '#FFC409',
            //     pointBackgroundColor: "#FFC409",
            //     pointBorderColor: '#000',
            //     pointHoverBackgroundColor: '#000',
            //     backgroundColor: "rgba(0, 0, 0, 0)",
            //     fill: 'origin',
            // },
            // {
            //     data: [28, 48, 40, 19, 86, 27, 90],
            //     label: 'Series B',
            //     backgroundColor: 'rgba(77,83,96,0.2)',
            //     borderColor: 'rgba(77,83,96,1)',
            //     pointBackgroundColor: 'rgba(77,83,96,1)',
            //     pointBorderColor: '#fff',
            //     pointHoverBackgroundColor: '#fff',
            //     pointHoverBorderColor: 'rgba(77,83,96,1)',
            //     fill: 'origin',
            // },
            // {
            //     data: [180, 480, 770, 90, 1000, 270, 400],
            //     label: 'Series C',
            //     yAxisID: 'y1',
            //     backgroundColor: 'rgba(255,0,0,0.3)',
            //     borderColor: 'red',
            //     pointBackgroundColor: 'rgba(148,159,177,1)',
            //     pointBorderColor: '#fff',
            //     pointHoverBackgroundColor: '#fff',
            //     pointHoverBorderColor: 'rgba(148,159,177,0.8)',
            //     fill: 'origin',
            // }
        ],
        labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };

    lineChartOptions: ChartConfiguration['options'] = {
        elements: {
            // line: {
            //     tension: 0.5
            // }
        },
        scales: {
            y: {
                position: 'left',
                grid: {
                    display: false,
                }
            },
            y1: {
                display: false,
                position: 'right',
                grid: {
                    color: 'rgba(0,0,0,0.3)',
                },
                // ticks: {
                //     color: 'red'
                // }
            },
            x: {
            }
        },

        plugins: {
            legend: { display: false },
            // annotation: {
            //     annotations: [
            //         {
            //             type: 'line',
            //             scaleID: 'x',
            //             value: 'March',
            //             borderColor: 'orange',
            //             borderWidth: 2,
            //             label: {
            //                 display: true,
            //                 position: 'center',
            //                 color: 'orange',
            //                 content: 'LineAnno',
            //                 font: {
            //                     weight: 'bold'
            //                 }
            //             }
            //         },
            //     ],
            // }
        }
    };

    lineChartType: ChartType = 'line';


    percents: number;
    total: number;


    constructor(
        private service: RestaurantService,
    ) {
        // Chart.register(Annotation)
    }


    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;





    async ngOnInit() {
        const result: { lastWeek: number[]; currentWeek: number[]; percentage: number; total: number; } = await this.service.get("analytics");

        console.log(result);

        this.percents = result.percentage;
        this.total = result.total;

        this.lineChartData.datasets.push({
            data: result.currentWeek,
            label: 'This week',
            borderColor: '#FFC409',
            pointBackgroundColor: "#FFC409",
            pointBorderColor: 'rgba(0, 0, 0, 0)',
            pointHoverBackgroundColor: '#000',
            backgroundColor: "#ffc60933",
            fill: 'origin',
        }, {
            data: result.lastWeek,
            label: 'Last week',
            borderColor: '#c9c9c9',
            pointBackgroundColor: "#c9c9c9",
            pointBorderColor: 'rgba(0, 0, 0, 0)',
            pointHoverBackgroundColor: '#000',
            backgroundColor: "rgba(0, 0, 0, 0)",
            fill: 'origin',
        });

        
        this.chart?.update();

    }


}