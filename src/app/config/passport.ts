import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import User from "../modules/user/user.model";
import { IsActive, UserRole } from "../modules/user/user.interface";
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
        // Since we don't have 'googleId' in your interface, we find user by email.
        const existingUser = await User.findOne({ email });

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
        const newUser = await User.create({
          email: email,
          name: name,
          picture: picture,
          // Google accounts are usually verified
          isVerified: true,
          // You must set a default role that fits your UserRole enum
          role: UserRole.STUDENT,
          // Initialize empty auths array
          auths: [
            {
              provider: "google",
              providerId: profile.id,
            },
          ],
          // Set other defaults if your schema requires them
          isActive: IsActive.ACTIVE,
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, undefined);
      }
    },
  ),
);

export default passport;
