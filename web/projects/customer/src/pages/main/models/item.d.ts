interface Item {
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
    modifiers: Modifier[]
}


interface Modifier {
    title: string;
    subtitle: string;
    
    _id: string;
    required: boolean;
    toSelect: number;
    toSelectAmount: string;

    options: {
        name: string;
        price: number;
        _id: string;
    }[];
}


export {
    Item,
    Modifier
}