import { Collection } from "../../src/models/restaurant.js";
import { id } from "../../src/utils/id.js";

export const DEFAULT_COLLECTIONS_IDS: string[] = [
    "appetizers",
    "entrees",
    "beverages",
    "desserts",
    "sides",
    "soups",
    "salads",
];

export const DEFAULT_COLLECTIONS: Collection[] = [
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
    }
];