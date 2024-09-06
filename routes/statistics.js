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

router.get('/report', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const today = new Date();

  const lastWeekEnd = new Date(today);
  lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
  const lastWeekStart = new Date(lastWeekEnd);
  lastWeekStart.setDate(lastWeekEnd.getDate() - 6);

  const twoWeeksAgoEnd = new Date(lastWeekStart);
  twoWeeksAgoEnd.setDate(lastWeekStart.getDate() - 1);
  const twoWeeksAgoStart = new Date(twoWeeksAgoEnd);
  twoWeeksAgoStart.setDate(twoWeeksAgoEnd.getDate() - 6);

  const lastWeekReviews = await prisma.routineReview.findMany({
    where: {
      userId: userId,
      createdAt: {
        gte: lastWeekStart,
        lt: new Date(lastWeekEnd.setDate(lastWeekEnd.getDate() + 1)),
      },
    },
    include: {
      subRoutineReviews: true,
      routine: true,
    },
  });

  const twoWeeksAgoReviews = await prisma.routineReview.findMany({
    where: {
      userId: userId,
      createdAt: {
        gte: twoWeeksAgoStart,
        lt: new Date(twoWeeksAgoEnd.setDate(twoWeeksAgoEnd.getDate() + 1)),
      },
    },
    include: {
      subRoutineReviews: true,
      routine: true,
    },
  });

  const allRoutines = await prisma.routine.findMany({
    where: {
      userId: userId,
      OR: [{ deletedAt: null }, { deletedAt: { gte: twoWeeksAgoStart } }],
    },
  });

  const lastWeekCompleted = lastWeekReviews.filter((review) => {
    return review.subRoutineReviews.some((subReview) => !subReview.isSkipped);
  }).length;

  const lastWeekSkipped = lastWeekReviews.filter((review) => {
    return review.subRoutineReviews.every((subReview) => subReview.isSkipped);
  }).length;

  const lastWeekFailed = allRoutines.length - lastWeekCompleted;

  const twoWeeksAgoCompleted = twoWeeksAgoReviews.filter((review) => {
    return review.subRoutineReviews.some((subReview) => !subReview.isSkipped);
  }).length;

  const twoWeeksAgoTotal = allRoutines.length;
  const twoWeeksAgoAchievementRate =
    (twoWeeksAgoCompleted / twoWeeksAgoTotal) * 100;

  let routineFailureCounts = {};

  allRoutines.forEach((routine) => {
    const routineId = routine.id;
    const lastWeekRoutineFailed = !lastWeekReviews.some(
      (review) => review.routineId === routineId
    );
    const twoWeeksAgoRoutineFailed = !twoWeeksAgoReviews.some(
      (review) => review.routineId === routineId
    );

    if (lastWeekRoutineFailed) {
      routineFailureCounts[routineId] =
        (routineFailureCounts[routineId] || 0) + 1;
    }
    if (twoWeeksAgoRoutineFailed) {
      routineFailureCounts[routineId] =
        (routineFailureCounts[routineId] || 0) + 1;
    }
  });

  let maxFailedRoutine = null;
  let maxFailedCount = 0;

  for (const routineId in routineFailureCounts) {
    if (routineFailureCounts[routineId] > maxFailedCount) {
      maxFailedCount = routineFailureCounts[routineId];
      maxFailedRoutine = allRoutines.find(
        (routine) => routine.id === parseInt(routineId)
      );
    }
  }

  let routineWeeklyReport = {};
  if (maxFailedRoutine) {
    const routineId = maxFailedRoutine.id;
    let currentWeekStart = new Date(lastWeekStart);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(currentWeekStart);
      currentDate.setDate(currentWeekStart.getDate() + i);

      if (currentDate < new Date(maxFailedRoutine.createdAt)) {
        routineWeeklyReport[currentDate.toISOString().split('T')[0]] =
          '생성되지 않음';
        continue;
      }

      const reviewOnDate = lastWeekReviews.find((review) => {
        return (
          review.routineId === routineId &&
          review.createdAt.toDateString() === currentDate.toDateString()
        );
      });

      let status = '실패';

      if (reviewOnDate) {
        const skipped = reviewOnDate.subRoutineReviews.every(
          (subReview) => subReview.isSkipped
        );
        if (skipped) {
          status = '건너뜀';
        } else {
          status = '달성';
        }
      }

      routineWeeklyReport[currentDate.toISOString().split('T')[0]] = status;
    }
  }

  const response = {
    current: {
      completed: lastWeekCompleted,
      failed: lastWeekFailed,
      passed: lastWeekSkipped,
    },
    past: {
      progress: twoWeeksAgoAchievementRate.toFixed(2) + '%',
    },
    maxFailedRoutine: maxFailedRoutine ? maxFailedRoutine : {},
    routineWeeklyReport: routineWeeklyReport,
  };

  res.json(response);
});

export default router;
