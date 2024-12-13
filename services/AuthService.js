
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

class AuthService {
    constructor(app, userService, db) {
        this.userService = userService; // Dependency on UserService
        this.db = db; // Database instance
        this.router = require('express').Router();
        this.initializeOAuth();
        this.setupRoutes(app);
    }

    initializeOAuth() {
        // Configure Google OAuth strategy
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: 'http://localhost:4000/auth/google/callback',
                    passReqToCallback: true,
                },
                async (request, accessToken, refreshToken, profile, done) => {
                    try {
                        // Call userService to handle OAuth user creation
                        const user = await this.userService.addUserThroughOAuth(profile);
                        return done(null, user);
                    } catch (err) {
                        console.error('Error during OAuth authentication:', err.stack);
                        return done(err, null);
                    }
                }
            )
        );

        // Serialize user to store in session
        passport.serializeUser((user, done) => {
            done(null, user.user_id); // Use `user_id` as session identifier
        });

        // Deserialize user from session
        passport.deserializeUser(async (id, done) => {
            try {
                const result = await this.db.query('SELECT * FROM "Users" WHERE user_id = $1', [id]);
                if (result.rows.length > 0) {
                    done(null, result.rows[0]); // Return the user object
                } else {
                    done(new Error('User not found'), null);
                }
            } catch (err) {
                console.error('Error during user deserialization:', err.stack);
                done(err, null);
            }
        });
    }

    setupRoutes(app) {
        // Configure session middleware
        app.use(
            require('express-session')({
                secret: process.env.SESSION_SECRET || 'default-secret', // Use a secure secret in production
                resave: false,
                saveUninitialized: true,
            })
        );
        app.use(passport.initialize());
        app.use(passport.session());

        // Define routes
        this.router.get('/', (req, res) => {
            res.send(`
                <h1>Welcome</h1>
                <a href="/auth/google">Authenticate with Google</a>
            `);
        });

        // Google OAuth login route
        this.router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

        // Google OAuth callback route
        this.router.get(
            '/auth/google/callback',
            passport.authenticate('google', {
                successRedirect: '/protected',
                failureRedirect: '/auth/google/failure',
            })
        );

        // Protected route
        this.router.get('/protected', this.isLoggedIn.bind(this), (req, res) => {
            res.send(`Hello ${req.user.email}`);
        });

        // Logout route
        this.router.get('/logout', (req, res, next) => {
            req.logout((err) => {
                if (err) return next(err);
                req.session.destroy();
                res.redirect('/');
            });
        });

        // OAuth failure route
        this.router.get('/auth/google/failure', (req, res) => {
            res.status(401).send('Failed to authenticate.');
        });

        // Attach routes to the app
        app.use('/', this.router);
    }

    // Middleware to check if the user is logged in
    isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).send('You must be logged in to access this page.');
    }
}

module.exports = AuthService;
