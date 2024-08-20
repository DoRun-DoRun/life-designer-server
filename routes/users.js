import express from 'express';
import prisma from '../prisma/prismaClient.js'; // prisma를 가져옵니다.
import { authenticateToken } from '../utils/authMiddleware.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../utils/jwtUtils.js';

var router = express.Router();

/* GET users listing. */
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
      // 사용자 정보가 없을 경우 에러를 발생시킴
      throw new Error('User not found');
    }
    res.json(req.user);
  } catch (error) {
    // 예외가 발생하면 next()를 통해 에러 처리 미들웨어로 전달
    next(error);
  }
});

// 에러 처리 미들웨어 추가
router.use((err, req, res, next) => {
  console.error(err.stack); // 서버 로그에 에러 스택 출력

  res.status(500).json({
    message: err.message || 'Internal Server Error',
    // 필요에 따라 추가적인 정보를 반환할 수 있음
  });
});

export default router;
