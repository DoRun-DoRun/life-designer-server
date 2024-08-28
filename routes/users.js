import { MemberStatus } from '@prisma/client';
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

  if (user && user.memberStatus === MemberStatus.Delete) {
    await prisma.routine.deleteMany({
      where: { userId: user.id },
    });

    await prisma.user.delete({
      where: { id: user.id },
    });

    user = null;
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email,
        authProvider: authProvider,
        memberStatus: MemberStatus.Register,
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

router.put('/', authenticateToken, async (req, res) => {
  const { name, age, job, challenges, gender } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        age,
        job,
        challenges,
        gender,
      },
    });

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'An error occurred while updating the user.' });
  }
});

router.put('/withdraw', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        memberStatus: MemberStatus.Delete,
        deletedAt: new Date(),
      },
    });

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'An error occurred while deleting the user.' });
  }
});

export default router;
