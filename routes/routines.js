import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';
import subRoutineRecommended from '../utils/gptUtils.js';
import {
  getNextAvailableDay,
  isRoutineFinishedToday,
  isRoutineIncluded,
} from '../utils/routineUtils.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const routines = await prisma.routine.findMany({
      where: {
        userId: req.user.id,
        isDeleted: false,
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
      isToday: isRoutineIncluded(routine.repeatDays),
      repeatDays: routine.repeatDays,
      nextAvailableIn: getNextAvailableDay(routine.repeatDays),
      name: routine.goal,
    }));

    routineModels.sort((a, b) => {
      if (a.isToday !== b.isToday) {
        return a.isToday ? -1 : 1;
      }
      if (a.isToday && a.isFinished !== b.isFinished) {
        return a.isFinished ? 1 : -1;
      }
      if (!a.isToday || !b.isToday) {
        return a.nextAvailableIn - b.nextAvailableIn;
      }
      return a.startTime - b.startTime;
    });

    res.json(routineModels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch routines' });
  }
});

router.get('/detail/:id', authenticateToken, async (req, res) => {
  const routineId = parseInt(req.params.id, 10);

  try {
    const routine = await prisma.routine.findUnique({
      where: { id: routineId, isDeleted: false },
      include: {
        subRoutines: { orderBy: { index: 'asc' } },
        routineReviews: true,
      },
    });

    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    const totalDuration = routine.subRoutines.reduce(
      (acc, subRoutine) => acc + subRoutine.duration,
      0
    );

    const response = {
      id: routine.id,
      name: routine.goal,
      startTime: routine.startTime,
      isFinished: routine.subRoutines.every(
        (subRoutine) => subRoutine.isFinished
      ),
      totalDuration,
      notificationTime: routine.notificationTime,
      repeatDays: routine.repeatDays,
      subRoutines: routine.subRoutines.map((subRoutine) => ({
        ...subRoutine,
        duration: subRoutine.duration,
      })),
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '루틴 조회 중 오류가 발생했습니다.' });
  }
});

router.post(
  '/',
  authenticateToken,
  /**
   *
   * @param {import('express').NextFunction} next
   */
  async (req, res, next) => {
    try {
      const util = req.query.util;
      const goal = req.body.goal;

      console.log(req.query);
      if (util === 'gpt') {
        console.log('gpt generated');

        const user = await prisma.user.findFirst({
          where: {
            id: req.user.id,
          },
        });

        const subRoutines = await subRoutineRecommended(user, goal);
        console.log(subRoutines);
        // const subRoutinesSaved = await createSubRoutines(routineId, subRoutines);
        // console.log(subRoutinesSaved);
        req.body.subRoutines = subRoutines;
        next();
      } else {
        console.log('no gpt');
        next();
      }
    } catch (error) {
      console.error('Error: error at /routines');
      res.status(500).json({ error: 'Failed to create routine with gpt' });
    }
  },
  async (req, res) => {
    const { goal, startTime, repeatDays, notificationTime, subRoutines } =
      req.body;

    try {
      const newRoutine = await prisma.routine.create({
        data: {
          userId: req.user.id,
          goal,
          startTime,
          repeatDays,
          notificationTime: notificationTime || null,
        },
      });

      const subRoutinesSaved = await createSubRoutines(
        newRoutine.id,
        subRoutines
      );

      // res.status(204).send();
      res.json({ routine: newRoutine, subRoutines: subRoutinesSaved });
    } catch (error) {
      console.error('Failed to create routine:', error);
      res.status(500).json({ error: 'Failed to create routine' });
    }
  }
);

async function createSubRoutines(routineId, subRoutines) {
  if (subRoutines && Array.isArray(subRoutines) && subRoutines.length > 0) {
    const lastSubRoutine = await prisma.subRoutine.findFirst({
      where: { routineId },
      orderBy: { index: 'desc' },
      select: { index: true },
    });

    const startingIndex = lastSubRoutine ? lastSubRoutine.index + 1 : 0;

    const subRoutineData = subRoutines.map((subRoutine, index) => ({
      routineId,
      goal: subRoutine.goal,
      duration: subRoutine.duration,
      emoji: subRoutine.emoji,
      index: startingIndex + index,
    }));

    await prisma.subRoutine.createMany({
      data: subRoutineData,
    });
    return await prisma.subRoutine.findMany({
      where: {
        routineId,
      },
    });
  }
}

router.delete('/detail/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // 먼저 해당 루틴이 존재하는지, 그리고 사용자의 루틴인지 확인
    const routine = await prisma.routine.findUnique({
      where: { id: parseInt(id, 10), isDeleted: false },
    });

    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    // 루틴이 현재 사용자의 루틴이 아닌 경우
    if (routine.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'You are not authorized to delete this routine' });
    }

    // 사용자의 루틴인 경우에만 삭제 진행
    await prisma.routine.update({
      where: { id: parseInt(id, 10), isDeleted: false },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete routine:', error);
    res.status(500).json({ error: 'Failed to delete routine' });
  }
});

/**
 * 루틴 업데이트
 */
router.put('/', authenticateToken, async (req, res) => {
  const { routineId, goal, startTime, repeatDays, notificationTime } = req.body;

  try {
    // 먼저 해당 루틴이 존재하는지, 그리고 사용자의 루틴인지 확인
    const routine = await prisma.routine.findUnique({
      where: { id: routineId, isDeleted: false },
    });

    if (!routine) {
      // 해당 루틴이 없다면
      return res.status(404).json({ error: 'Routine not found' });
    }

    // 루틴이 현재 사용자의 루틴이 아닌 경우
    if (routine.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'You are not authorized to modify this routine' });
    }

    // 사용자의 루틴인 경우에만 업데이트 진행
    // 업데이트할 경우, 기존 루틴은 가상 루틴으로 빼서 만든다. createdAt과 updatedAt을 기존 updatedAt과 이후 updatedAt으로 맞춘다.
    // archivedRoutine이 가상 루틴이다.

    const archivedCreatedAt = routine.updatedAt;
    const archivedRepeatDays = [...routine.repeatDays];
    const archivedStartTime = routine.startTime;

    const updatedRoutine = await prisma.routine.update({
      where: { id: routineId, isDeleted: false },
      data: {
        goal,
        startTime,
        repeatDays,
        notificationTime: notificationTime || null,
      },
    });

    const archivedUpdatedAt = updatedRoutine.updatedAt;

    await prisma.virtualRoutine.create({
      data: {
        routineId: updatedRoutine.id,
        startTime: archivedStartTime,
        createdAt: archivedCreatedAt,
        updatedAt: archivedUpdatedAt,
        repeatDays: archivedRepeatDays,
      },
    });
    // TODO: Transaction

    res.status(200).json(updatedRoutine);
  } catch (error) {
    console.error('Failed to update routine:', error);
    res.status(500).json({ error: 'Failed to update routine' });
  }
});

/**
 * 리뷰를 작성합니다.
 */
router.post('/routine/review', authenticateToken, async (req, res) => {
  const { routineId, overallRating, comments, subRoutineReviews } = req.body;

  try {
    const routineReview = await prisma.routineReview.create({
      data: {
        routineId: routineId,
        userId: req.user.id,
        overallRating: overallRating,
        comments: comments,
        subRoutineReviews: {
          create: subRoutineReviews.map((sub) => ({
            subRoutineId: sub.subRoutineId,
            timeSpent: sub.timeSpent,
            isSkipped: sub.isSkipped,
          })),
        },
      },
    });

    res.status(201).json(routineReview);
  } catch (error) {
    console.error('Failed to create routine review:', error);
    res.status(500).json({ error: 'Failed to create routine review' });
  }
});

export default router;
