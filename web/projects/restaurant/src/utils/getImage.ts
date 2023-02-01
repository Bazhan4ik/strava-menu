export function getImage(file: any): string {
    try {
        if(file) {
            return `data:image/jpeg;base64,${file.toString("base64")}`;
        }
        return null!;
    } catch (e) {
        console.error("ERROR CONVERTING IMAGE");
        throw e;
    }
}