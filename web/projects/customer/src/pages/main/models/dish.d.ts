interface Dish {
    name: string;
    _id: string;
    id: string;
    price: number;
    description: string;
    image: {
        buffer: any;
        resolution: number;
    }
}



export {
    Dish
}