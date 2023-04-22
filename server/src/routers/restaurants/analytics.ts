import { Router } from "express";
import { Locals } from "../../models/general.js";
import { logged } from "../../middleware/auth.js";
import { restaurantWorker } from "../../middleware/restaurant.js";
import { getOrders } from "../../utils/data/orders.js";




const router = Router({ mergeParams: true });




router.get("/", logged(), restaurantWorker({}, {}), async (req, res) => {
    const { restaurant } = res.locals as Locals;


    const passedSincePreviousSundayMidnight = () => {
        // Get the current date and time
        const currentDate = new Date();

        // Calculate the milliseconds in a day
        const millisecondsPerDay = 24 * 60 * 60 * 1000;

        // Calculate the number of days between the current date and the last Sunday
        const daysSinceLastSunday = (currentDate.getDay() + 7) % 7;

        // Calculate the milliseconds of the last Sunday
        const lastSundayMilliseconds = currentDate.getTime() - (daysSinceLastSunday * millisecondsPerDay);

        // Calculate the milliseconds of the Sunday before the last Sunday
        const lastWeekSundayMilliseconds = lastSundayMilliseconds - (7 * millisecondsPerDay);

        const lastWeekSunday = new Date(lastWeekSundayMilliseconds);

        // Set the time to 00:00:00
        lastWeekSunday.setHours(0, 0, 0, 0);

        // Get the milliseconds of the last week's Sunday 00:00:00
        const lastWeekSundayMilliseconds00 = lastWeekSunday.getTime();

        return lastWeekSundayMilliseconds00;
    }
    const passedSinceLastSundayMidnight = () => {
        const currentDate = new Date();

        // Set date to current this week's sunday
        currentDate.setDate(currentDate.getDate() - currentDate.getDay());

        // Set time to midnight
        currentDate.setHours(0, 0, 0);

        return currentDate.getTime();
    }
    const findPercentage = () => {
        // last week full amount
        let lw = 0;
        // current week full amount
        let cw = 0


        for(const amount of currentWeek) {
            cw += amount;
        }
        for(const amount of lastWeek) {
            lw += amount;
        }
        
        // difference of amounts
        const difference = cw - lw;

        // by how many percents current week bigger or smaller than last week
        const percentage = (difference / cw) * 100;

        return Math.floor(percentage);
    }


    const sincePreviousSunday = passedSincePreviousSundayMidnight();
    const sinceLastSunday = passedSinceLastSundayMidnight();
    



    const orders = await getOrders(
        restaurant._id,
        { "timing.ordered": { $gte: sincePreviousSunday }},
        { projection: { payment: { money: 1, }, dishes: { dishId: 1 }, timing: { ordered: 1, } } }
    ).toArray();


    const lastWeek: number[] =     [0, 0, 0, 0, 0, 0, 0];
    const currentWeek: number[] =  [0, 0, 0, 0, 0, 0, 0];


    for(let order of orders) {
        const date = new Date(order.timing.ordered!);

        if(order.timing.ordered! > sinceLastSunday) {
            if(!currentWeek[date.getDay()]) {
                currentWeek[date.getDay()] = 0;
            }
    
            currentWeek[date.getDay()] += order.payment?.money?.total! / 100;
        } else {
            if(!lastWeek[date.getDay()]) {
                lastWeek[date.getDay()] = 0;
            }
    
            lastWeek[date.getDay()] += order.payment?.money?.total! / 100;
        }

    }

    for(const index in currentWeek) {
        if(currentWeek[index] == 0) {
            currentWeek[index] = null!;
        }
    }




    res.send({ lastWeek, currentWeek, total: currentWeek.reduce((a, b) => (a || 0) + (b || 0), 0).toFixed(2), percentage: findPercentage() });
});





export {
    router as AnalyticsRouter,
}




