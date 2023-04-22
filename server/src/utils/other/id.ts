import { ObjectId } from "mongodb";

function id(id?: string | ObjectId) {

    
    if(!id) {
        return new ObjectId();
    }
    
    if(typeof id == "string" && id.length != 24) {
        return null! as ObjectId;
    }

    return new ObjectId(id);
}


export {
    id
}