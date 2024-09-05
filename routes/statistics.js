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

export default router;
