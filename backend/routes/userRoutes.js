import express from "express";
import {registerUser, allUsers} from "../controllers/userControllers.js";
import passport from "passport";

const router = express.Router();

router.route("/").post(registerUser).get(ensureAuthenticated,allUsers);
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      // Auth failed
      return res.status(401).json({ message: info.message || "Login failed" });
    }

    req.logIn(user, (err) => {
      if (err) return next(err);

      // Auth succeeded, respond with user info
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        pic: user.pic,
      });
    });
  })(req, res, next);
});



export default router;