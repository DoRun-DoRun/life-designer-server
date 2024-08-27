import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';

var router = express.Router();

function isRoutineFinishedToday(routineReviews) {
  const today = new Date();
  return routineReviews.some((review) => {
    const reviewDate = new Date(review.reviewDate);
    return reviewDate.toDateString() === today.toDateString();
  });
}

router.get('/', authenticateToken, async function (req, res, next) {
  try {
    console.log('$Fetching routines for user:', req.user.id);
    const routines = await prisma.routine.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        subRoutines: true,
        routineReviews: true,
      },
    });

    const routineModels = routines.map((routine) => ({
      id: routine.id,
      startTime: routine.startTime,
      isFinished: isRoutineFinishedToday(routine.routineReviews),
      name: routine.goal,
    }));

    return res.json(routineModels); // 응답 후 함수 종료
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch routines' }); // 응답 후 함수 종료
  }
});

router.get('/detail/:id', authenticateToken, async function (req, res, next) {
  const routineId = parseInt(req.params.id, 10);

  try {
    const routine = await prisma.routine.findUnique({
      where: { id: routineId },
      include: {
        subRoutines: true, // subRoutines 포함
      },
    });

    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    // totalDuration 계산
    const totalDuration = routine.subRoutines.reduce((acc, subRoutine) => {
      const durationDateTime = new Date(subRoutine.duration); // duration을 Date 객체로 변환
      const durationInMinutes =
        durationDateTime.getHours() * 60 + durationDateTime.getMinutes(); // 시간을 분으로 변환
      return acc + durationInMinutes;
    }, 0);

    // 반환할 데이터 구조 생성
    const response = {
      id: routine.id,
      name: routine.goal, // goal을 name으로 사용
      startTime: routine.startTime,
      isFinished: routine.subRoutines.every(
        (subRoutine) => subRoutine.isFinished
      ), // 모든 subRoutine이 완료되었는지 확인
      totalDuration: totalDuration,
      subRoutines: routine.subRoutines.map((subRoutine) => ({
        ...subRoutine,
        duration:
          new Date(subRoutine.duration).getHours() * 60 * 60 +
          new Date(subRoutine.duration).getMinutes() * 60,
      })),
    };
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '루틴 조회 중 오류가 발생했습니다.' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { goal, startTime, repeatDays, notificationTime } = req.body;

  try {
    const newRoutine = await prisma.routine.create({
      data: {
        userId: req.user.id,
        goal: goal,
        startTime: new Date(startTime),
        repeatDays: repeatDays,
        notificationTime: notificationTime ? new Date(notificationTime) : null,
      },
    });

    res.status(201).json({
      id: newRoutine.id,
      startTime: newRoutine.startTime,
      isFinished: false,
      name: newRoutine.goal,
    });
  } catch (error) {
    console.error('Failed to create routine:', error);
    res.status(500).json({ error: 'Failed to create routine' });
  }
});

router.post('/sub_routine', authenticateToken, async (req, res) => {
  const { id, goal, duration, emoji } = req.body;

  try {
    const newSubRoutine = await prisma.subRoutine.create({
      data: {
        routineId: id,
        goal: goal,
        duration: new Date(duration),
        emoji: emoji,
      },
    });

    res.status(201).json(newSubRoutine);
  } catch (error) {
    console.error('Failed to create subRoutine:', error);
    res.status(500).json({ error: 'Failed to create subRoutine' });
  }
});

export default router;
