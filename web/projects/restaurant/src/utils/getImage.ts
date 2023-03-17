export function getImage(file: any): string {
    try {
        if(typeof file == "string" && file.slice(0, 4) == "data") {
            return file;
        }
        if(file) {
            return `data:image/jpeg;base64,${file.toString("base64")}`;
        }
        return null!;
    } catch (e) {
        console.error("ERROR CONVERTING IMAGE");
        throw e;
    }
}