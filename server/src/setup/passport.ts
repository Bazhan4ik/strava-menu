import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";



passport.use(new GoogleStrategy({
    clientID: "165605278939-a4hrmf3kni2esi8j65ligkpl90unqf3i.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "https://account.localhost:3000/auth/google/callback",
}, (accessToken, refreshToken, profile, cb) => {
        console.log(profile.id);
    }
));

passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: "CREATE JWT KEY AND ADD HERE"
}, (payload, done) => {

    if(!payload.expires || !payload.userId) {
        return done("invalid");
    }

    if(typeof payload.expires != "number" || typeof payload.userId != "string") {
        return done("invalid");
    }


    if(payload.expires < Date.now()) {
        return done("expired");
    }

    return done(null, payload.userId);

}));



export {
    passport,
}