import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const routineReviews = await prisma.routineReview.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const uniqueDates = [
      ...new Set(
        routineReviews.map(
          (review) => review.createdAt.toISOString().split('T')[0]
        )
      ),
    ];

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (uniqueDates.length == 0) {
      response = {
        maxStreak: 0,
        recentStreak: 0,
        totalProcessDays: 0,
      };
      res.json(response);
    }

    let maxStreak = 1;
    let currentStreak = 1;
    let totalProcessDays = 1;
    let recentStreak = 1;
    let recentStreakFound = false;

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterdayString) {
      recentStreakFound = true;
      recentStreak = 0;
    }

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currentDate = new Date(uniqueDates[i]);
      totalProcessDays++;

      const diffDays = Math.floor(
        (currentDate - prevDate) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === -1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);

        if (!recentStreakFound) {
          recentStreak = currentStreak;
        }
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;

        if (!recentStreakFound) {
          recentStreakFound = true;
        }
      }
    }

    const recentDates = uniqueDates.slice(0, recentStreak);

    let totalValidRoutines = 0;

    for (let date of recentDates) {
      const routinesOnDate = await prisma.routine.count({
        where: {
          userId: req.user.id,
          OR: [{ deletedAt: null }, { deletedAt: { gte: new Date(date) } }],
        },
      });

      totalValidRoutines += routinesOnDate;
    }

    const totalReviews = await prisma.routineReview.count({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: new Date(recentDates[recentDates.length - 1]),
          lt: new Date(
            new Date(recentDates[0]).setDate(
              new Date(recentDates[0]).getDate() + 1
            )
          ),
        },
      },
    });

    const recentPerformanceRate =
      (totalReviews / (totalValidRoutines * recentStreak)) * 100;

    const response = {
      maxStreak: maxStreak,
      recentStreak: recentStreak,
      totalProcessDays: totalProcessDays,
      recentPerformanceRate: recentPerformanceRate,
    };

    res.json(response);
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

router.get('/calendar', authenticateToken, async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res
      .status(400)
      .json({ error: 'month와 year 파라미터가 필요합니다.' });
  }

  const today = new Date();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const userId = req.user.id;

  const routineReviews = await prisma.routineReview.findMany({
    where: {
      userId: userId,
      createdAt: {
        gte: startDate,
        lt: new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate() + 1
        ),
      },
    },
    include: {
      subRoutineReviews: true,
      routine: true,
    },
  });

  const routines = await prisma.routine.findMany({
    where: {
      userId: userId,
      OR: [{ deletedAt: null }, { deletedAt: { gte: startDate } }],
    },
  });

  let response = {};

  for (let day = 1; day <= endDate.getDate(); day++) {
    const currentDate = new Date(year, month - 1, day);

    if (currentDate > today) {
      break;
    }

    const reviewsOnDate = routineReviews.filter((review) => {
      return (
        review.createdAt.toISOString().split('T')[0] ===
        currentDate.toISOString().split('T')[0]
      );
    });

    const validRoutinesOnDate = routines.filter((routine) => {
      return (
        (routine.deletedAt === null ||
          new Date(routine.deletedAt) >= currentDate) &&
        new Date(routine.createdAt) <= currentDate
      );
    });

    const skippedReviews = reviewsOnDate.filter((review) => {
      return review.subRoutineReviews.every((subReview) => subReview.isSkipped);
    });

    const failedRoutines = validRoutinesOnDate.filter((routine) => {
      return !reviewsOnDate.some((review) => review.routineId === routine.id);
    });

    const completedRoutines = reviewsOnDate
      .filter((review) => !skippedReviews.includes(review))
      .map((review) => review.routine.goal);

    const failedRoutineNames = failedRoutines.map((routine) => routine.goal);

    const skippedRoutineNames = skippedReviews.map(
      (review) => review.routine.goal
    );

    response[day] = {
      완료됨: completedRoutines,
      실패함: failedRoutineNames,
      건너뜀: skippedRoutineNames,
    };
  }

  res.json(response);
});

export default router;
