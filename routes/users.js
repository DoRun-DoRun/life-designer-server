import express from 'express';
import prisma from '../prisma/prismaClient.js'; // prisma를 가져옵니다.
import { authenticateToken } from '../utils/authMiddleware.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../utils/jwtUtils.js';

var router = express.Router();

router.post('/', async (req, res, next) => {
  const { email, authProvider } = req.body;

  let user = await prisma.user.findUnique({
    where: { email: email, authProvider: authProvider },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email,
        authProvider: authProvider,
        memberStatus: 'Regiester',
      },
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return res.json({
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});

router.get('/', authenticateToken, (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    res.json(req.user);
  } catch (error) {
    next(error);
  }
});

router.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

export default router;
