import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';
import { getDatesBetween, getMaxStreak } from '../utils/statisticsUtils.js';

const router = express.Router();

/**
 * 사용자 루틴 리뷰 통계 조회
 * 사용자의 루틴 리뷰 데이터를 바탕으로 최근 진행 상황, 최대 연속 기록, 총 진행 일수 등의 통계를 조회합니다.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // 모든 리뷰
    const routineReviews = await prisma.routineReview.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    // 만약 수행한 적이 없다면, 전부 0을 응답합니다. 
    if (routineReviews.length === 0) {
      response = {
        maxStreak: 0,
        recentStreak: 0,
        totalProcessDays: 0,
        recentPerformanceRate: 0
      };
      res.json(response);
    }

    // 날짜 중복을 제거합니다.
    const uniqueDates = [
      ...new Set(
        routineReviews.map(
          (review) => review.createdAt.toISOString().split('T')[0]
        )
      ),
    ];

    const allRoutines = await prisma.routine.findMany({
      where: {
        userId: req.user.id
      }
    });
    const allVirtualRoutines = [];
    
    allRoutines.forEach(async (routine) => {
      const virtualRoutines = await prisma.virtualRoutine.findMany({
        where: {
          routineId: routine.id
        }
      });
      allVirtualRoutines.push(...virtualRoutines);
    });

    // routine은 updated 순간 직후, 어제까지의 수행 가능 일자를 가져온다. (수행시작시간 <> 업데이트시간)
    // vroutine은 created 순간 직후, updatedAt 이하의 수행 기능 일자를 가져온다. ()

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const actionDates = [];
    allRoutines.forEach(routine => {
      const { updatedAt, deletedAt } = routine;
      actionDates.push(...getDatesBetween(routine, updatedAt, deletedAt ?? yesterday));
    });

    allVirtualRoutines.forEach(routine => {
      const { createdAt, updatedAt } = routine;
      actionDates.push(...getDatesBetween(routine, createdAt, updatedAt));
    });

    const uniqueActionDates = [...new Set(actionDates)].reverse();
    uniqueDates;
    const minLength = Math.min(uniqueActionDates.length, uniqueDates.length);
    let currentStreak = 0;
    for(let i = 0; i < minLength; i++) {
      if(uniqueActionDates[i] !== uniqueDates[i]) {
        break;
      }
      currentStreak++;
    }
    const recentStreak = currentStreak;

    // 최대 부분 연속 수열
    const maxStreak = getMaxStreak(uniqueActionDates, uniqueDates);
    const totalProcessDays = uniqueDates.length;
    const recentPerformanceRate = Math.min(
      routineReviews.length*100 / actionDates,
      100
    );
    const response = {
      maxStreak: maxStreak,
      recentStreak: recentStreak,
      totalProcessDays: totalProcessDays,
      recentPerformanceRate: recentPerformanceRate,
    };
    res.json(response);

  } catch(error) {
    console.error('Failed to fetch statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * 월별 루틴 리뷰 기록 조회
 * 사용자가 선택한 월과 연도에 대해 매일의 루틴 수행 상태를 조회합니다. 각 날짜별로 완료된, 실패한, 건너뛴 루틴들을 확인할 수 있습니다.
 */
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

  // 이거 지금 그냥 루틴만 되어있는데, 수정 이전의 루틴에 대해서도 가져와서 통계를 내야함.
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

  // 일단 해당 달에 유효한 모든 가상 루틴을 모두 가져오고, 나중에 필터링 할 예정
  const archivedRoutines = await prisma.virtualRoutine.findMany({
    where: {
      userId: userId,
      updatedAt: {
        gte: startDate
      },
      createdAt: {
        lte: endDate
      }
    }
  });

  let response = {};

  // 1일부터 마지막일까지 반복
  for (let day = 1; day <= endDate.getDate(); day++) {
    const currentDate = new Date(year, month - 1, day);

    // 오늘까지만 반복
    if (currentDate > today) {
      break;
    }

    // 현재 날짜에 해당하는 모든 리뷰
    const reviewsOnDate = routineReviews.filter((review) => {
      return (
        review.createdAt.toISOString().split('T')[0] ===
        currentDate.toISOString().split('T')[0]
      );
    });

    // 현재 시점에서 삭제되지 않은 모든 루틴 (updatedAt도 고려해야함 + virtualRoutine도 고려해야함.)
    const validRoutinesOnDate = [...routines.filter((routine) => {
      return (
        (routine.deletedAt === null ||
          new Date(routine.deletedAt) >= currentDate) &&
        new Date(routine.createdAt) <= currentDate
      );
    }), ...
    archivedRoutines.filter((routine) => {
      return(
        new Date(routine.updatedAt) >= currentDate &&
        new Date(routine.createdAt) <= currentDate
      )
    })];

    // 스킵, 완료, 실패한 리뷰(루틴)들을 모두 가져옴.

    const skippedReviews = reviewsOnDate.filter((review) => { // 전부 스킵인 것만 스킵. 스킵한 리뷰를 가져옴
      return review.subRoutineReviews.every((subReview) => subReview.isSkipped);
    });

    const failedRoutines = validRoutinesOnDate.filter((routine) => { // 해당일에 리뷰가 하나도 없으면
      return !reviewsOnDate.some((review) => review.routineId === routine.id);
    });

    const completedRoutines = reviewsOnDate
      .filter((review) => !skippedReviews.includes(review)) // 스킵한거 빼고 가져오기
      .map((review) => review.routine.goal); // 완료된 루틴 이름 가져오기

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

/**
 * 주간 루틴 성과 보고서 조회
 * 지난 주와 지지난 주의 루틴 성과를 비교 분석하여 보고서를 제공합니다. 주별 성과와 가장 많이 실패한 루틴에 대한 주간 보고서를 포함합니다.
 */
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

  // 지난 주 모든 리뷰
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

  // 지지난주 모든 리뷰 
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

  // 모든 루틴 (지금 지지난주를 해야하는데 이건 모든 루틴을 다가져오는거임)
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
