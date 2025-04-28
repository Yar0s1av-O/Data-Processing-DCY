const express = require('express');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const TokenService = require('./TokenService');





class AuthService {
    constructor(app, userService, db, tokenService) {
        this.userService = userService;
        this.db = db;
        this.tokenService = tokenService;
        this.router = require('express').Router();
        this.initializeOAuth();
        this.setupRoutes(app);
    }

    initializeOAuth() {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback',
                    passReqToCallback: true,
                },
                async (request, accessToken, refreshToken, profile, done) => {
                    try {
                        const user = await this.userService.addUserThroughOAuth(profile);
                        return done(null, user);
                    } catch (error) {
                        console.error('OAuth Error:', error);
                        return done(error, null);
                    }
                }
            )
        );

        passport.serializeUser((user, done) => {
            done(null, user.user_id);
        });

        passport.deserializeUser(async (id, done) => {
            try {
                const result = await this.db.query('SELECT * FROM "Users" WHERE user_id = $1', [id]);
                if (result.rows.length > 0) {
                    done(null, result.rows[0]);
                } else {
                    done(new Error('User not found'), null);
                }
            } catch (error) {
                console.error('Deserialization Error:', error);
                done(error, null);
            }
        });
    }

    setupRoutes(app) {
        app.use(
            session({
                secret: process.env.SESSION_SECRET || 'default_secret',
                resave: false,
                saveUninitialized: false,
                cookie: {
                    secure: false, // Set to true if using HTTPS
                    httpOnly: true,
                    sameSite: 'lax',
                },
            })
        );
        app.use(passport.initialize());
        app.use(passport.session());

        // Auth routes
        this.router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

        this.router.get(
            '/auth/google/callback',
            passport.authenticate('google', { failureRedirect: '/auth/google/failure' }),
            (req, res) => {
                res.redirect('/profile');
            }
        );

        this.router.get('/auth/google/failure', (req, res) => {
            res.status(401).send('Authentication Failed');
        });

        this.router.get('/logout', (req, res, next) => {
            req.logout(err => {
                if (err) return next(err);
                req.session.destroy(() => {
                    res.redirect('/');
                });
            });
        });

        // Protected route
        this.router.get('/profile', this.isAuthenticated, async (req, res) => {
            try {
                let accessToken = req.user.access_token;
                const refreshToken = req.user.refresh_token;
        
                if (!accessToken && refreshToken) {
                    // Use the tokenService that was injected
                    accessToken = await this.tokenService.refreshAccessToken(refreshToken);
        
                    // Update the user's access token in the database
                    await this.db.query(
                        `UPDATE "Users" SET access_token = $1 WHERE user_id = $2`,
                        [accessToken, req.user.user_id]
                    );
                }
        
                res.status(200).json({
                    message: `Welcome back, ${req.user.name || req.user.email.split('@')[0]}!`,
                    user: {
                        user_id: req.user.user_id,
                        email: req.user.email,
                        name: req.user.name,
                        profile_picture: req.user.profile_picture,
                        access_token: accessToken
                    }
                });
            } catch (err) {
                console.error('Error refreshing token:', err.stack);
                res.status(500).json({ message: 'Server error' });
            }
        });

        // Public home page
        this.router.get('/', (req, res) => {
            res.send(`
                <h1>Welcome to OAuth Demo</h1>
                <a href="/auth/google">Login with Google</a>
            `);
        });

        app.use('/', this.router);
    }

    isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports = AuthService;
