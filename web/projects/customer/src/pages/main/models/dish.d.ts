interface Dish {
    info: {
        name: string;
        description: string;
        price: number;
    }
    _id: string;
    id: string;
    updateImage: boolean;
    library: {
        preview: any;
        blur: any;
    }
}



export {
    Dish
}