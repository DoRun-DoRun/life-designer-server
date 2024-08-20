import express from 'express';
import { authenticateToken } from '../utils/authMiddleware.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../utils/jwtUtils.js';
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/auth/token', authenticateToken, (req, res, next) => {
  const accessToken = generateAccessToken(req.user);
  const refreshToken = generateRefreshToken(req.user);

  return res.json({
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});

export default router;
