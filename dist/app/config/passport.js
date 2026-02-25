"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_local_1 = require("passport-local");
const user_interface_1 = require("../modules/user/user.interface");
const user_model_1 = __importDefault(require("../modules/user/user.model"));
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
        const existingUser = await user_model_1.default.findOne({ email });
        if (existingUser) {
            // Security checks
            if (existingUser.isDeleted) {
                return done(null, false, { message: "User is deleted." });
            }
            if (!existingUser.isVerified) {
                return done(null, false, { message: "User is not verified." });
            }
            if (existingUser.isActive === user_interface_1.IsActive.BLOCKED ||
                existingUser.isActive === user_interface_1.IsActive.INACTIVE) {
                return done(null, false, {
                    message: `User is ${existingUser.isActive}.`,
                });
            }
            // OPTIONAL: Update picture or name if they changed on Google
            existingUser.name = name;
            existingUser.picture = picture;
            await existingUser.save();
            return done(null, existingUser);
        }
        // CREATE NEW USER IF NOT FOUND
        const newUser = await user_model_1.default.create({
            email: email,
            name: name,
            picture: picture,
            // Google accounts are usually verified
            isVerified: true,
            role: user_interface_1.UserRole.STUDENT,
            auths: [
                {
                    provider: "google",
                    providerId: profile.id,
                },
            ],
            isActive: user_interface_1.IsActive.ACTIVE,
        });
        return done(null, newUser);
    }
    catch (error) {
        return done(error, undefined);
    }
}));
// 4. LOCAL STRATEGY
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: "email",
    passwordField: "password",
}, async (email, password, done) => {
    try {
        const isUserExists = await user_model_1.default.findOne({ email });
        if (!isUserExists) {
            return done("User does not exist.");
        }
        if (isUserExists.isDeleted) {
            return done(null, false, { message: "User is deleted." });
        }
        if (!isUserExists.isVerified) {
            return done(null, false, { message: "User is not verified." });
        }
        if (isUserExists.isActive === user_interface_1.IsActive.BLOCKED ||
            isUserExists.isActive === user_interface_1.IsActive.INACTIVE) {
            return done(null, false, {
                message: `User is ${isUserExists.isActive}.`,
            });
        }
        const isGoogleAuthenticated = isUserExists.auths.some((providerObject) => providerObject.provider === "google");
        if (isGoogleAuthenticated && !isUserExists.password) {
            return done(null, false, {
                message: "You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for your Gmail and then you can login with email and password.",
            });
        }
        if (!isUserExists.password) {
            return done(null, false, {
                message: "Password not set for this account",
            });
        }
        const isPasswordMatched = await bcryptjs_1.default.compare(password, isUserExists.password);
        if (!isPasswordMatched) {
            return done(null, false, { message: "Password does not match" });
        }
        return done(null, isUserExists);
    }
    catch (error) {
        done(error);
    }
}));
exports.default = passport_1.default;
