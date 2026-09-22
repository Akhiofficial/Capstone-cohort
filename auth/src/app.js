import dotenv from 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import cookies from 'cookie-parser'
import authRoutes from "./routes/auth.routes.js"
import cors from 'cors'

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookies());
app.use(passport.initialize());

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}))


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"

}, (accessToken, refreshToken, profile, done) => {
    // Here you would typically find or create a user in your database 
    // for this example we will create a new user
    return done(null, profile);
}))

app.use('/api/auth', authRoutes);

app.get("/_status/healthz", (req, res) => {
    res.status(200).json({ status: "ok" });
})

app.get("/_status/readyz", (req, res) => {
    res.status(200).json({ status: "ok" });
})


export default app;