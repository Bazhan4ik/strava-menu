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
        list: { resolution: number; buffer: any; }[];
        preview: any;
        blur: any;
    }
}



export {
    Dish
}