interface Session {
    id: string;
    type: "dinein" | "takeout";

    dishes: { _id: string; dishId: string; comment: string; }[];
}



export {
    Session
}