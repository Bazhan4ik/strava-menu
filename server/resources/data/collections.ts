import { Collection, Folder } from "../../src/models/restaurant.js";
import { id } from "../../src/utils/other/id.js";


export const DEFAULT_COLLECTIONS_IDS: string[] = [
    "appetizers",
    "entrees",
    "beverages",
    "desserts",
    "sides",
    "soups",
    "salads",

    "breakfast",
    "brunch",
    "late-night",
    "lunch",
    "dinner",
];
export const DEFAULT_FOLDERS_IDS: string[] = [
    "meal-times",
    "default",
    "other",
];


const DEFAULT_COLLECTIONS: Collection[] = [
    {
        name: "Appetizers",
        id: "appetizers",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Entrees",
        id: "entrees",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Beverages",
        id: "beverages",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Desserts",
        id: "desserts",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Sides",
        id: "sides",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Soups",
        id: "soups",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Salads",
        id: "salads",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },


    /**
     * 
     * TIMES OF DAY
     * 
     */
    {
        name: "Breakfast",
        id: "breakfast",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Brunch",
        id: "brunch",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Lunch",
        id: "lunch",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Dinner",
        id: "dinner",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Late Night",
        id: "late-night",
        items: [],
        description: null!,
        _id: id(),
        image: null!,
    },
];
const DEFAULT_FOLDERS: Folder[] = [
    {
        name: "Meal Times",
        id: "meal-times",
        _id: id(),
        collections: [],
    },
    {
        name: "Default",
        id: "default",
        _id: id(),
        collections: [],
    },
    {
        name: "Other",
        id: "other",
        _id: id(),
        collections: [],
    }
]

export function getDefaultCollections() {
    const collections = [];
    for(let collection of DEFAULT_COLLECTIONS) {
        collection._id = id();
        collections.push(collection);
    }

    return collections;
}