import crypto from "crypto";

function encryptPassword(rawPassword: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const key = crypto.pbkdf2Sync(rawPassword, salt, 10000, 1024, 'sha512');
    const encryptedPassword = key.toString('hex');
    return `${salt}:${encryptedPassword}`;
}


function comparePasswords(encryptedPassword: string, rawPassword: string) {
    const [salt, originalEncryptedPassword] = encryptedPassword.split(':');
    const key = crypto.pbkdf2Sync(rawPassword, salt, 10000, 1024, 'sha512');
    const reEncryptedPassword = key.toString('hex');
    return originalEncryptedPassword === reEncryptedPassword;
}



export {
    comparePasswords,
    encryptPassword,
}