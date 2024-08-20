// jwtUtils.js
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = 'your_access_token_secret';
const REFRESH_TOKEN_SECRET = 'your_refresh_token_secret';

export function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
}

export function generateRefreshToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '14d' });
}
