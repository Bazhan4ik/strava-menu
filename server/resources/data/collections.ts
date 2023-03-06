import { Collection, Folder } from "../../src/models/restaurant.js";
import { id } from "../../src/utils/id.js";


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
        dishes: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Entrees",
        id: "entrees",
        dishes: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Beverages",
        id: "beverages",
        dishes: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Desserts",
        id: "desserts",
        dishes: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Sides",
        id: "sides",
        dishes: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Soups",
        id: "soups",
        dishes: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Salads",
        id: "salads",
        dishes: [],
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
        dishes: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Brunch",
        id: "brunch",
        dishes: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Lunch",
        id: "lunch",
        dishes: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Dinner",
        id: "dinner",
        dishes: [],
        description: null!,
        _id: id(),
        image: null!,
    },
    {
        name: "Late Night",
        id: "late-night",
        dishes: [],
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
    const folders = [];
    for(let folder of DEFAULT_FOLDERS) {
        folder._id = id();
        folder.collections = [];

        if(folder.id == "meal-times") {
            for(const collection of collections) {
                if([
                    "breakfast",
                    "brunch",
                    "late-night",
                    "lunch",
                    "dinner",
                ].includes(collection.id)) {
                    folder.collections.push(collection._id);
                }
            }
        } else if(folder.id == "default") {
            for(const collection of collections) {
                if([
                    "appetizers",
                    "entrees",
                    "beverages",
                    "desserts",
                    "sides",
                    "soups",
                    "salads"
                ].includes(collection.id)) {
                    folder.collections.push(collection._id);
                }
            }
        }

        folders.push(folder);
    }

    return { collections, folders };
}