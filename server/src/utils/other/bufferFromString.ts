function bufferFromString(base64String: string) {

    if(!base64String) {
        return null!;
    }

    // Removing the "data:*/*;base64," from the base64 string
    const base64 = base64String.split(',')[1];

    // Converting the base64 string to a buffer
    const buffer = Buffer.from(base64, 'base64');

    return buffer;
}



export {
    bufferFromString,
}