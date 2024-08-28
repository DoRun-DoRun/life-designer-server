import { MemberStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/prismaClient.js';

const ACCESS_TOKEN_SECRET = 'your_access_token_secret';
const REFRESH_TOKEN_SECRET = 'your_refresh_token_secret';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log(`토큰 확인 ${authHeader}`);
  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user) {
      console.log('User Not Found');
      return res.sendStatus(404);
    }

    if (user.memberStatus == MemberStatus.Delete) {
      console.log('User Deleted');
      return res.sendStatus(403);
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    req.user = user;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}

export async function authenticateRefreshToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user) {
      console.log('User Not Found');
      return res.sendStatus(404);
    }

    if (user.memberStatus == MemberStatus.Delete) {
      console.log('User Deleted');
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}
