import { MemberStatus } from '@prisma/client';
import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../utils/jwtUtils.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  const { email, authProvider } = req.body;
  console.log(email);

  try {
    let user = await prisma.user.findUnique({
      where: { email, authProvider },
    });
    console.log(user);

    if (user && user.memberStatus === MemberStatus.Delete) {
      console.log('DELETED');

      await prisma.routine.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      user = null;
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          authProvider,
          memberStatus: MemberStatus.Register,
        },
      });
    }

    const tokens = {
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user),
    };
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticateToken, (req, res, next) => {
  console.log('User');
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    if (req.user.MemberStatus == MemberStatus.Delete) {
      throw new Error('User Deleted');
    }
    res.json(req.user);
  } catch (error) {
    next(error);
  }
});

router.put('/', authenticateToken, async (req, res) => {
  const { name, age, job, challenges, gender, memberStatus } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, age, job, challenges, gender, memberStatus },
    });
    res.json(updatedUser);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'An error occurred while updating the user.' });
  }
});

router.put('/withdraw', authenticateToken, async (req, res) => {
  try {
    const deletedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        memberStatus: MemberStatus.Delete,
        deletedAt: new Date(),
      },
    });
    res.json(deletedUser);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'An error occurred while deleting the user.' });
  }
});

export default router;
