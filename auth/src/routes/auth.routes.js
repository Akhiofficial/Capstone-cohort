import { Router } from "express";
import passport from "passport";
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/', session: false }), async (req, res) => {
    try {
        const { id, displayName, emails, photos } = req.user;
        let user = await User.findOne({ googleId: id });

        if (!user) {
            user = new User({
                googleId: id,
                name: displayName,
                email: emails[0].value,
                avatar: photos[0].value,

            })
            await user.save();
        }

        // Generate token 
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // set token in cookie 
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
        });
        res.redirect("/");
    } catch (error) {
        console.log("error during Google authication", error);
        res.redirect("/");
    }
});

export default router; 