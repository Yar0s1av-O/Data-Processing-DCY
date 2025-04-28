const jwt = require('jsonwebtoken');

class TokenService {
    generateAccessToken(user) {
        return jwt.sign(
            { user_id: user.user_id, email: user.email },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '15m' } // Access token short life (example: 15 minutes)
        );
    }

    generateRefreshToken(user) {
        return jwt.sign(
            { user_id: user.user_id, email: user.email },
            process.env.REFRESH_TOKEN_SECRET || 'your_refresh_secret_key',
            { expiresIn: '7d' } // Refresh token lasts longer (example: 7 days)
        );
    }

    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'your_refresh_secret_key');
        } catch (err) {
            return null;
        }
    }
}

module.exports = TokenService;
