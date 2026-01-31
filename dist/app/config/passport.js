"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const user_model_1 = __importDefault(require("../modules/user/user.model"));
const user_interface_1 = require("../modules/user/user.interface");
const env_1 = __importDefault(require("./env"));
// 1. SERIALIZATION
// We store the MongoDB _id in the session
// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
// 2. DESERIALIZATION
// We retrieve the full user document using the _id from the session
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await user_model_1.default.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
// 3. GOOGLE STRATEGY
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_1.default.GOOGLE_CLIENT_ID,
    clientSecret: env_1.default.GOOGLE_CLIENT_SECRET,
    callbackURL: env_1.default.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    // Extract data from Google Profile
    const email = profile.emails?.[0].value;
    const name = profile.displayName;
    const picture = profile.photos?.[0].value;
    if (!email) {
        return done(new Error("No email provided by Google"), undefined);
    }
    try {
        // CHECK IF USER EXISTS
        // Since we don't have 'googleId' in your interface, we find user by email.
        const existingUser = await user_model_1.default.findOne({ email });
        if (existingUser) {
            // OPTIONAL: Update picture or name if they changed on Google
            existingUser.name = name;
            existingUser.picture = picture;
            await existingUser.save();
            return done(null, existingUser);
        }
        // CREATE NEW USER IF NOT FOUND
        // We need to provide required fields from your Interface.
        // I'm setting default values for 'role' and 'auths'. Adjust as needed.
        const newUser = await user_model_1.default.create({
            email: email,
            name: name,
            picture: picture,
            // Google accounts are usually verified
            isVerified: true,
            // You must set a default role that fits your UserRole enum
            role: user_interface_1.UserRole.STUDENT,
            // Initialize empty auths array
            auths: [
                {
                    provider: "google",
                    providerId: profile.id,
                },
            ],
            // Set other defaults if your schema requires them
            isActive: user_interface_1.IsActive.ACTIVE,
        });
        return done(null, newUser);
    }
    catch (error) {
        return done(error, undefined);
    }
}));
exports.default = passport_1.default;
