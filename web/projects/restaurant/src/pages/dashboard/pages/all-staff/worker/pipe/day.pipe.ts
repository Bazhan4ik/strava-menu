import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dayOfWeek' })
export class DayOfWeekPipe implements PipeTransform {
    transform(value: number): string {
        switch (value) {
            case 0: return 'Sun';
            case 1: return 'Mon';
            case 2: return 'Tue';
            case 3: return 'Wed';
            case 4: return 'Thu';
            case 5: return 'Fri';
            case 6: return 'Sat';
            default: return '';
        }
    }
}