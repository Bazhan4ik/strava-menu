export const config = {
    headless: false,
    url: {
        main: "https://www.mydomain.com:3000",
        account: "https://account.mydomain.com:3000",
        customer: "https://restaurant.mydomain.com:3000",
        restaurant: "https://restaurant.mydomain.com:3000/dashboard",
        staff: "https://restaurant.mydomain.com:3000/staff",
        defaultRestaurantId: "potatosita",
    },
    time: {
        selectorTimeout: 5000
    },
    throw: {
        selector: false,
        input: false,
        click: false,
        iframe: false,
    },
    viewPort: {
        width: 1200,
        height: 900,
    },
    db: {
        main: "mainTest",
        sessions: "sessionsTest",
        orders: "ordersTest",
    }
}