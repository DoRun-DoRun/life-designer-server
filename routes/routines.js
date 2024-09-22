import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';
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

router.post('/', authenticateToken, async (req, res) => {
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

    await createSubRoutines(newRoutine.id, subRoutines);

    res.status(204).send();
  } catch (error) {
    console.error('Failed to create routine:', error);
    res.status(500).json({ error: 'Failed to create routine' });
  }
});

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
  }
}

router.delete('/detail/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.routine.update({
      where: {
        id: parseInt(id, 10),
        isDeleted: false,
      },
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

router.put('/', authenticateToken, async (req, res) => {
  const { routineId, goal, startTime, repeatDays, notificationTime } = req.body;

  try {
    const updatedRoutine = await prisma.routine.update({
      where: { id: routineId, isDeleted: false },
      data: {
        goal,
        startTime,
        repeatDays,
        notificationTime: notificationTime || null,
      },
    });

    res.status(200).json(updatedRoutine);
  } catch (error) {
    console.error('Failed to update routine:', error);
    res.status(500).json({ error: 'Failed to update routine' });
  }
});

export default router;
