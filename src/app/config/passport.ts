import bcrypt from "bcryptjs";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { IsActive, UserRole } from "../modules/user/user.interface";
import User from "../modules/user/user.model";
import envVariables from "./env";

// 1. SERIALIZATION
// We store the MongoDB _id in the session
// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// 2. DESERIALIZATION
// We retrieve the full user document using the _id from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// 3. GOOGLE STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: envVariables.GOOGLE_CLIENT_ID,
      clientSecret: envVariables.GOOGLE_CLIENT_SECRET,
      callbackURL: envVariables.GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      // Extract data from Google Profile
      const email = profile.emails?.[0].value;
      const name = profile.displayName;
      const picture = profile.photos?.[0].value;

      if (!email) {
        return done(new Error("No email provided by Google"), undefined);
      }

      try {
        // CHECK IF USER EXISTS
        const existingUser = await User.findOne({ email });

        if (existingUser) {
          // OPTIONAL: Update picture or name if they changed on Google
          existingUser.name = name;
          existingUser.picture = picture;
          await existingUser.save();

          return done(null, existingUser);
        }

        // CREATE NEW USER IF NOT FOUND
        const newUser = await User.create({
          email: email,
          name: name,
          picture: picture,
          // Google accounts are usually verified
          isVerified: true,
          role: UserRole.STUDENT,
          auths: [
            {
              provider: "google",
              providerId: profile.id,
            },
          ],
          isActive: IsActive.ACTIVE,
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, undefined);
      }
    },
  ),
);

// 4. LOCAL STRATEGY
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      try {
        const isUserExists = await User.findOne({ email });

        if (!isUserExists) {
          return done("User does not exist.");
        }

        const isGoogleAuthenticated = isUserExists.auths.some(
          (providerObject) => providerObject.provider === "google",
        );

        if (isGoogleAuthenticated && !isUserExists.password) {
          return done(null, false, {
            message:
              "You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for your Gmail and then you can login with email and password.",
          });
        }

        if (!isUserExists.password) {
          return done(null, false, {
            message: "Password not set for this account",
          });
        }

        const isPasswordMatched = await bcrypt.compare(
          password,
          isUserExists.password,
        );

        if (!isPasswordMatched) {
          return done(null, false, { message: "Password does not match" });
        }

        return done(null, isUserExists);
      } catch (error) {
        done(error);
      }
    },
  ),
);

export default passport;
