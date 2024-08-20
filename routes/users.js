import express from 'express';
import prisma from '../prisma/prismaClient.js'; // prisma를 가져옵니다.
import { authenticateToken } from '../utils/authMiddleware.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtils.js';


var router = express.Router();

/* GET users listing. */
router.post('/', async function(req, res, next) {
  const { email, authProvider } = req.body;

  let user = await prisma.user.findUnique({
    where: { email: email, authProvider: authProvider }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email,
        authProvider: authProvider,
        memberStatus: 'Regiester'
      }
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return res.json({
    accessToken: accessToken,
    refreshToken: refreshToken
  });
});

router.get('/profile', authenticateToken, (req, res) => {
  // authenticateToken 미들웨어가 성공적으로 통과하면 req.user에 사용자 정보가 담겨 있습니다.
  res.json(req.user);
});

export default router
