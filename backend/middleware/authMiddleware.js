// auth.js
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";

export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized - please login" });
}


export function initializePassport(db) {
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
          if (result.rows.length === 0) {
            return done(null, false, { message: "No user found" });
          }
          const user = result.rows[0];
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Incorrect password" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        return done(null, false);
      }
      done(null, result.rows[0]);
    } catch (err) {
      done(err);
    }
  });

  return passport.initialize();
}

export default {ensureAuthenticated, initializePassport};