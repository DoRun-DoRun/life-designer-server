import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';
var router = express.Router();

/* GET home page. */
router.get('/', authenticateToken, async function (req, res, next) {
  try {
    const routines = await prisma.routine.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        subRoutines: true,
        routineReviews: true,
      },
    });

    res.json(routines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch routines' });
  }
});

router.post('/', async function (req, res, next) {
  const { userId, goal, startTime, repeatDays, notificationTime, subRoutines } =
    req.body;

  try {
    // 루틴 생성
    const routine = await prisma.routine.create({
      data: {
        userId: userId,
        goal: goal,
        startTime: new Date(startTime),
        repeatDays: repeatDays,
        notificationTime: notificationTime ? new Date(notificationTime) : null,
        subRoutines: {
          create: subRoutines.map((subRoutine) => ({
            goal: subRoutine.goal,
            duration: subRoutine.duration,
            emoji: subRoutine.emoji || null,
          })),
        },
      },
      include: {
        subRoutines: true, // 생성된 하위 루틴도 함께 반환
      },
    });

    res.status(201).json(routine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '루틴 생성 중 오류가 발생했습니다.' });
  }
});

export default router;
