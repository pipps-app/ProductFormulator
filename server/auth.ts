import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Configure Local Strategy (email/password)
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    if (!user.password) {
      return done(null, false, { message: 'Please sign in with Google' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Configure Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await storage.getUserByGoogleId(profile.id);
    
    if (user) {
      return done(null, user);
    }

    // Check if user exists with same email
    if (profile.emails && profile.emails[0]) {
      user = await storage.getUserByEmail(profile.emails[0].value);
      if (user) {
        // Link Google account to existing user
        await storage.updateUser(user.id, {
          googleId: profile.id,
          profileImage: profile.photos?.[0]?.value,
          authProvider: 'google'
        });
        return done(null, user);
      }
    }

    // Create new user
    const newUser = await storage.createUser({
      username: profile.displayName || profile.emails?.[0]?.value?.split('@')[0] || 'user',
      email: profile.emails?.[0]?.value || '',
      googleId: profile.id,
      profileImage: profile.photos?.[0]?.value,
      authProvider: 'google',
      role: 'user'
    });

    return done(null, newUser);
  } catch (error) {
    return done(error);
  }
}));

// Serialize/deserialize user for sessions
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;