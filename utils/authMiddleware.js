// authMiddleware.js
import jwt from 'jsonwebtoken';
import prisma from '../prisma/prismaClient.js';

const ACCESS_TOKEN_SECRET = 'your_access_token_secret';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user) {
      console.log("User Not Found")
      return res.sendStatus(404); // User not found
    }

    req.user = user; // 요청 객체에 사용자 정보를 추가
    next(); // 다음 미들웨어 또는 라우트로 이동
  } catch (err) {
    return res.sendStatus(403); // Forbidden
  }
}
