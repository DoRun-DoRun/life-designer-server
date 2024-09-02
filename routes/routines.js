import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';

var router = express.Router();

function isRoutineFinishedToday(routineReviews) {
  const today = new Date();
  return routineReviews.some((review) => {
    const reviewDate = new Date(review.createdAt);
    return reviewDate.toDateString() === today.toDateString();
  });
}

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

    const routineModels = routines.map((routine) => ({
      id: routine.id,
      startTime: routine.startTime,
      isFinished: isRoutineFinishedToday(routine.routineReviews),
      name: routine.goal,
    }));

    return res.json(routineModels);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch routines' });
  }
});

router.get('/detail/:id', authenticateToken, async function (req, res, next) {
  const routineId = parseInt(req.params.id, 10);

  try {
    const routine = await prisma.routine.findUnique({
      where: { id: routineId },
      include: {
        subRoutines: true,
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
      totalDuration: totalDuration,
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

router.post('/', authenticateToken, async (req, res) => {
  const { goal, startTime, repeatDays, notificationTime, subRoutines } =
    req.body;

  try {
    const newRoutine = await prisma.routine.create({
      data: {
        userId: req.user.id,
        goal: goal,
        startTime: startTime,
        repeatDays: repeatDays,
        notificationTime: notificationTime ? notificationTime : null,
      },
    });

    if (subRoutines && Array.isArray(subRoutines) && subRoutines.length > 0) {
      const subRoutineData = subRoutines.map((subRoutine) => ({
        routineId: newRoutine.id,
        goal: subRoutine.goal,
        duration: subRoutine.duration,
        emoji: subRoutine.emoji,
      }));

      await prisma.subRoutine.createMany({
        data: subRoutineData,
      });
    }

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

router.delete('/detail/:id', authenticateToken, async (req, res, next) => {
  const { id } = req.params;

  try {
    await prisma.routine.delete({
      where: { id: parseInt(id) },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Failed to delete routine:', error);
    return res.status(500).json({ error: 'Failed to delete routine' });
  }
});

router.post('/sub_routine', authenticateToken, async (req, res) => {
  const subRoutines = req.body;

  try {
    const createdSubRoutines = await Promise.all(
      subRoutines.map(async (subRoutine) => {
        const { routineId, goal, duration, emoji } = subRoutine;

        const newSubRoutine = await prisma.subRoutine.create({
          data: {
            routineId: routineId,
            goal: goal,
            duration: duration,
            emoji: emoji,
          },
        });

        return newSubRoutine;
      })
    );

    res.status(201).json(createdSubRoutines);
  } catch (error) {
    console.error('Failed to create subRoutines:', error);
    res.status(500).json({ error: 'Failed to create subRoutines' });
  }
});

router.put('/sub_routine/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { routineId, goal, duration, emoji } = req.body;

  try {
    await prisma.subRoutine.update({
      where: { id: id },
      data: {
        routineId: routineId,
        goal: goal,
        duration: duration,
        emoji: emoji,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to update subRoutine:', error);
    res.status(500).json({ error: 'Failed to update subRoutine' });
  }
});

router.delete('/sub_routine/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.subRoutine.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete subRoutine:', error);
    res.status(500).json({ error: 'Failed to delete subRoutine' });
  }
});

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
