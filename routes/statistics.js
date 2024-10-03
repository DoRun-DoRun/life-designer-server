import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';
import { getDatesBetween, getLastWeekFrom, getMaxStreak, getOnlyDate } from '../utils/statisticsUtils.js';

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
    yesterday.setUTCHours(23, 59, 59, 999);

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
      routineReviews.length*100 / actionDates.length,
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
      routineId: {
        in: routines.map(routine=>routine.id)
      },
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
        new Date(routine.updatedAt) <= currentDate && 
        (routine.deletedAt === null || new Date(routine.deletedAt) >= currentDate)
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
      if(routine.repeatDays[(currentDate.getDay() + 6)%7] === false) return false;
      return !reviewsOnDate.some((review) => review.routineId === routine.id);
    });

    const completedRoutines = reviewsOnDate
      .filter((review) => !skippedReviews.includes(review)) // 스킵한거 빼고 가져오기
      .map((review) => review.routine.goal); // 완료된 루틴 이름 가져오기

    const failedRoutineNames = failedRoutines.map(
      (routine) => {
        return routine.goal ?? routines.filter(r=>r.id==routine.routineId)[0].goal
      }
    );

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

  // DB가 without timezone이기 때문에 보정 필요?
  const today = new Date();

  // TODO: 시간을 23시 59분 59초 999분으로 설정해야되는지 여부
  const {lastWeekEnd, lastWeekStart} = getLastWeekFrom(today);

  const {lastWeekEnd: twoWeeksAgoEnd, lastWeekStart: twoWeeksAgoStart} = getLastWeekFrom(lastWeekStart);

  // 해당 주에 유효한 모든 루틴들을 가져온다.
  // 아니다 유저의 모든 루틴을 가져온다.

  const routines = await prisma.routine.findMany({
    where: {
      userId: userId,
      createdAt: {
        lte: lastWeekEnd
      },
      OR: [
        {
          deletedAt: null
        },
        {
          deletedAt: {
            gte: twoWeeksAgoStart
          }
        }
      ]
    }
  });

  const maxFailedRoutineIds = {

  }

  let currentDate = new Date(twoWeeksAgoStart);
  const twoWeeksAgoStatuses = {'완료됨': 0, '건너뜀': 0, '실패함': 0};
  while(currentDate < twoWeeksAgoEnd) {
    for(let i = 0; i < routines.length; i++) {
      const routine = routines[i];
      const status = await getRoutineStatusAt(routine.id, currentDate);
      if(maxFailedRoutineIds[routine.id] === undefined) {
        maxFailedRoutineIds[routine.id] = 0;
      } else {
        maxFailedRoutineIds[routine.id]++;
      }
      console.log(currentDate, status);
      if(twoWeeksAgoStatuses[status] !== undefined) {
        twoWeeksAgoStatuses[status]++;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1); // next
  }

  const lastWeekStatuses = {'완료됨': 0, '건너뜀': 0, '실패함': 0};
  while(currentDate < lastWeekEnd) {
    for(let i = 0; i < routines.length; i++) {
      const routine = routines[i];
      const status = await getRoutineStatusAt(routine.id, currentDate);
      if(lastWeekStatuses[status] !== undefined) {
        lastWeekStatuses[status]++;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1); // next
  }

  let maxFailedRoutineId = 0;
  let maxFailedRoutineNum = 0;
  for(let key in maxFailedRoutineIds) {
    if(maxFailedRoutineIds[key] > maxFailedRoutineNum) {
      maxFailedRoutineNum = maxFailedRoutineIds[key];
      maxFailedRoutineId = key;
    }
  }

  const maxFailedRoutine = await prisma.routine.findFirst({
    where: {
      id: +maxFailedRoutineId
    }
  });

  const twoWeeksAgoAchievementRate = (
    (
      twoWeeksAgoStatuses['완료됨'] + 
      twoWeeksAgoStatuses['건너뜀']
    ) / 
    (
      twoWeeksAgoStatuses['완료됨'] + 
      twoWeeksAgoStatuses['건너뜀'] + 
      twoWeeksAgoStatuses['실패함']
    )
  );
  const lastWeekAchivementRate = (
    (
      lastWeekStatuses['완료됨'] + 
      lastWeekStatuses['건너뜀']
    ) / 
    (
      lastWeekStatuses['완료됨'] + 
      lastWeekStatuses['건너뜀'] + 
      lastWeekStatuses['실패함']
    )
  );
  const differentInWeeks = lastWeekAchivementRate - twoWeeksAgoAchievementRate;

  const routineWeeklyReport = {};

  currentDate = new Date(lastWeekStart);
  while(currentDate < lastWeekEnd) {
    for(let i = 0; i < routines.length; i++) {
      const routine = routines[i];
      const status = await getRoutineStatusAt(routine.id, currentDate);
      routineWeeklyReport[getOnlyDate(currentDate)] = status;
    }
    currentDate.setDate(currentDate.getDate() + 1); // next
  }

  const response = {
    current: {
      completed: lastWeekStatuses['완료됨'],
      failed: lastWeekStatuses['실패함'],
      passed: lastWeekStatuses['건너뜀'],
    },
    progress: {
      twoWeeksAgoProgress: isNaN(twoWeeksAgoAchievementRate) ? null :
        twoWeeksAgoAchievementRate.toFixed(2) + '%',
      lastWeekProgresds: isNaN(lastWeekAchivementRate) ? null :
        lastWeekAchivementRate.toFixed(2) + '%',
      differentInWeeks:  isNaN(differentInWeeks) ? null :
        differentInWeeks.toFixed(2) +'%',
    },
    maxFailedRoutineLastWeek: maxFailedRoutine ? maxFailedRoutine : {},
    routineWeeklyReport: routineWeeklyReport,
  };

  res.json(response);
});

/**
 * 지난주 루틴 리스트를 출력한다.
 * 삭제된 루틴도 포함되며 각 날짜별로 해당 루틴이 수행되었는지 표기한다.
 */
router.get('/report-details', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  // TODO: Refactoring - getRoutinesBetweenDates, getLastWeekFrom
  // DB가 without timezone이기 때문에 보정 필요?
  const today = new Date();

  // TODO: 시간을 23시 59분 59초 999분으로 설정해야되는지 여부
  const {lastWeekEnd, lastWeekStart} = getLastWeekFrom(today);
  const routines = await prisma.routine.findMany({
    where: {
      userId: userId,
      createdAt: {
        lte: lastWeekEnd
      },
      OR: [
        {
          deletedAt: null
        },
        {
          deletedAt: {
            gte: lastWeekStart
          }
        }
      ]
    }
  });
  // 루틴 id별 object 생성, id별로 일 주일 동안의 status 표기
  for(let i = 0; i < routines.length; i++) {
    const routine = routines[i];
    routines[i]['status'] = {};
    let currentDate = new Date(lastWeekStart);
    while(currentDate < lastWeekEnd) {
      routines[i]['status'][getOnlyDate(currentDate)] = 0
      currentDate.setDate(currentDate.getDate() + 1); // next
    }
  }
  let currentDate = new Date(lastWeekStart);
  while(currentDate < lastWeekEnd) {
    for(let i = 0; i < routines.length; i++) {
      const routine = routines[i];
      const status = await getRoutineStatusAt(routine.id, currentDate);
      if(routines[i]['status'][getOnlyDate(currentDate)] !== undefined) {
        routines[i]['status'][getOnlyDate(currentDate)] = status
      }
    }
    currentDate.setDate(currentDate.getDate() + 1); // next
  }
  res.json(routines);
});

router.get('/test', authenticateToken, async (req, res) => {
  const {year, month, date} = req.query;
  const d = new Date();
  d.setFullYear(year, month-1, date);
  const response = await getRoutineStatusAt(2, d);
  res.json(response);
})

/**
 * 
 * @param {Int} routineId
 * @param {Date} date 
 * @returns {Promise<string>} status 완료됨, 건너뜀, 실패함, 일정없음, 삭제됨, 생성되지않음
 */
const getRoutineStatusAt = async (routineId, date) => {
  const nowDate = new Date();
  const currentDate = new Date(date);
  const currentDateStart = new Date(currentDate);
  const currentDateEnd = new Date(
    getOnlyDate(currentDate) === getOnlyDate(nowDate) ? date : currentDate
  );
  currentDateStart.setHours(0, 0, 0, 0);
  currentDateEnd.setHours(23, 59, 59, 999);
  // routineId에 해당하는 routine과 virtualRoutines를 가져온다.
  const routine = await prisma.routine.findFirst({
    where: {
      id: routineId,
    },
  });

  // 루틴 시작 시간 변수
  const currentDateEndReviewTime = new Date(
    currentDateEnd
  );
  currentDateEndReviewTime.setSeconds(
    currentDateEndReviewTime.getSeconds() + routine.startTime
  );
  const currentDateStartTime = new Date(currentDateStart);
  currentDateStartTime.setHours(0, 0, 0, 0);
  currentDateStartTime.setSeconds(routine.startTime);

  const virtualRoutines = await prisma.virtualRoutine.findMany({
    where: {
      routineId,
    },
  }); 
  let currentRoutines = [];
  const routineTimeDate = new Date(currentDate);
  routineTimeDate.setHours(0, 0, 0, 0);
  routineTimeDate.setSeconds(routine.startTime);

  if(routine.createdAt > currentDateEnd) {
    return "생성되지않음";
  }

  if(routine.deletedAt !== null && routine.deletedAt <= currentDateStart) {
    return "삭제됨";
  }

  if(routine.updatedAt < currentDateStartTime && 
    !routine.repeatDays[(currentDate.getDay() + 6)%7]) {
    return "일정없음";
  }
  // 해당일에 해당하는 virtualReview를 구해옴. Day 비교해서 일정 여부 결정
  for(let i = 0; i < virtualRoutines.length; i++) {
    const virtualRoutine = virtualRoutines[i];
    const virtualCurrentDateStartTime = new Date(currentDateStart);
    virtualCurrentDateStartTime.setHours(0, 0, 0, 0);
    virtualCurrentDateStartTime.setSeconds(virtualRoutine.startTime);
    if(virtualRoutine.createdAt < virtualCurrentDateStartTime && 
      !virtualRoutine.repeatDays[(currentDate.getDay() + 6)%7]) {
      return "일정없음";
    }
  }

  if((routine.updatedAt <= currentDateEnd && 
    routine.updatedAt <= routineTimeDate)
    && 
    (routine.deletedAt === null || (routine.deletedAt < routineTimeDate)
  )) {
    currentRoutines.push(routine);
  }

  currentRoutines.push([...virtualRoutines.filter(routine => {
    if((routine.createdAt <= currentDateEnd && 
      routine.createdAt <= routineTimeDate)
      && 
      (routine.updatedAt < routineTimeDate)) {
      return true;
    }
    return false;
  })]);

  // 뉴틴 = 루틴 or 가상루틴
  // 하나라도 성공이면 성공 -> 해당 날짜에 review가 하나라도있으면 성공
  // 전부 다 패스면 패스 -> 해당 날짜에 review가 전부 패스면 패스
  // 전부 다 실패면 싪패 -> 나머진 실패
  
  const reviews = await prisma.routineReview.findMany({
    where: {
      routineId: routineId,
      createdAt: {
        gte: currentDateStart,
        lte: currentDateEndReviewTime
      }
    },
    include: {
      subRoutineReviews: true
    }
  });
  if(reviews.length === 0) return "실패함";
  const isSkipped = reviews.every((review) => 
    review.subRoutineReviews.every(subReview => subReview.isSkipped == true)
  );
  if(isSkipped) return "건너뜀";
  return '완료됨';
}

export default router;
