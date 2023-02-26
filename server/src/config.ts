// export const mainDBName = "mainTest";
// export const ordersDBName = "ordersTest";
// export const sessionsDBName = "sessionsTest";
// export const dishesDBName = "dishesTest";


export const mainDBName: string = await new Promise(res => setTimeout(() => {
    res(process.env.MAIN_DB_NAME as string);
}, 10));
export const ordersDBName: string = await new Promise(res => setTimeout(() => {
    res(process.env.ORDERS_DB_NAME as string);
}, 10));
export const sessionsDBName: string = await new Promise(res => setTimeout(() => {
    res(process.env.SESSIONS_DB_NAME as string);
}, 10));
export const dishesDBName: string = await new Promise(res => setTimeout(() => {
    res(process.env.DISHES_DB_NAME as string);
}, 10));