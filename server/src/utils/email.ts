import nodemailer from "nodemailer";


function isValidEmail(email: string) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
}



const Email = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ctraba.business@gmail.com',
        pass: 'tgphcddicttmsstf'
    }
});


async function sendEmail(email: string, title: string, html: string) {
    if(!isValidEmail(email)) {
        return 0;
    }

    const options: any = {
        from: "StravaMenu",
        to: email,
        subject: title,
        html,
    };

    try {
        await Email.sendMail(options);

        return 1;
    } catch (error) {
        console.error(error);
        return 0;
    }
    
}


export {
    isValidEmail,
    sendEmail
}