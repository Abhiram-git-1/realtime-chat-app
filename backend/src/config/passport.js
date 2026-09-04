const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/User");

passportGoogleStrategyCallback = async (_accessToken,_refreshToken,profile,done) => {
      try {
        // 1. Extract Google profile information
        const googleId = profile.id;

        const googleEmail = profile.emails?.[0];

        const email = googleEmail?.value
          ?.toLowerCase()
          .trim();

        const isGoogleEmailVerified =
          googleEmail?.verified === true;

        const name = profile.displayName;

        const avatar =
          profile.photos?.[0]?.value || null;

        // 2. Validate Google email

        if (!email) {
          return done(
            new Error(
              "Google account does not provide an email"
            )
          );
        }

        if (!isGoogleEmailVerified) {
          return done(
            new Error(
              "Google email is not verified"
            )
          );
        }
        // 3. Find user by Google ID
        let user = await User.findOne({
          googleId,
        });
        // 4. Google account is not linked yet
       
        if (!user) {

          // Check whether the email already
          // belongs to an existing account

          user = await User.findOne({
            email,
          });
          // 5. Existing email account
          //    → Link Google account
          if (user) {
            user.googleId = googleId;

            // Google has verified this email,
            // so our application can mark it verified.
            user.isEmailVerified = true;
            if (!user.avatar && avatar) {
              user.avatar = avatar;
            }
            await user.save();
          }// 6. Completely new user
          else {
            user = await User.create({
              name,
              username: `google_${googleId}`,
              email,
              googleId,
              avatar,
              // Google verified the email
              isEmailVerified: true,
              accountStatus: "active",
            });
          }
        }
        // 7. Authentication successful
        return done(null, user);

      } catch (error) {
        return done(error, null);
      }
}; 

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    passportGoogleStrategyCallback 
  )
);

module.exports = passport;
/*
Google gives profile
       ↓
Get email + verified
       ↓
Is email present?
       ↓
Is email verified?
       ↓
Find by googleId
       ↓
 ┌───────────────┐
 │               │
Found          Not found
 │               │
 │          Find by email
 │               │
 │          ┌────┴────┐
 │          │         │
 │       Found      Not found
 │          │         │
 │      Link Google  Create User
 │          │         │
 │      verified=true verified=true
 │          │         │
 └──────────┴─────────┘
              ↓
       done(null, user) 
*/