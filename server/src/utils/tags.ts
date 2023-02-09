import { tags } from "../../resources/data/tags.js";


function getTags(ids: string[]) {
    const result = [];

    for(let tag of tags) {
        for(let id of ids) {
            if(tag.id == id) {
                result.push(tag);

                if(result.length == ids.length) {
                    return result;
                }

                break;
            }
        }
    }

    return result;
}



export {
    getTags,
}