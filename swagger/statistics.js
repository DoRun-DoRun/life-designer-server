/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: 통계 및 분석 관련 API
 */

/**
 * @swagger
 * /statistics:
 *   get:
 *     summary: 사용자 루틴 리뷰 통계 조회
 *     tags: [Statistics]
 *     description: 사용자의 루틴 리뷰 데이터를 바탕으로 최근 진행 상황, 최대 연속 기록, 총 진행 일수 등의 통계를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 maxStreak:
 *                   type: integer
 *                   description: 사용자의 최대 연속 루틴 수행 일수
 *                 recentStreak:
 *                   type: integer
 *                   description: 사용자의 최근 연속 루틴 수행 일수
 *                 totalProcessDays:
 *                   type: integer
 *                   description: 사용자의 총 루틴 수행 일수
 *                 recentPerformanceRate:
 *                   type: number
 *                   format: float
 *                   description: 최근 루틴 수행률 (퍼센트)
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /statistics/calendar:
 *   get:
 *     summary: 월별 루틴 리뷰 기록 조회
 *     tags: [Statistics]
 *     description: 사용자가 선택한 월과 연도에 대해 매일의 루틴 수행 상태를 조회합니다. 각 날짜별로 완료된, 실패한, 건너뛴 루틴들을 확인할 수 있습니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 월 (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 연도
 *     responses:
 *       200:
 *         description: 월별 루틴 기록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   완료됨:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 해당 날짜에 완료된 루틴 목록
 *                   실패함:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 해당 날짜에 실패한 루틴 목록
 *                   건너뜀:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 해당 날짜에 건너뛴 루틴 목록
 *       400:
 *         description: 필수 파라미터가 누락됨 (month와 year)
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /statistics/report:
 *   get:
 *     summary: 주간 루틴 성과 보고서 조회
 *     tags: [Statistics]
 *     description: 지난 주와 지지난 주의 루틴 성과를 비교 분석하여 보고서를 제공합니다. 주별 성과와 가장 많이 실패한 루틴에 대한 주간 보고서를 포함합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 주간 보고서 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 current:
 *                   type: object
 *                   properties:
 *                     completed:
 *                       type: integer
 *                       description: 지난 주에 완료된 루틴 수
 *                     failed:
 *                       type: integer
 *                       description: 지난 주에 실패한 루틴 수
 *                     passed:
 *                       type: integer
 *                       description: 지난 주에 건너뛴 루틴 수
 *                 past:
 *                   type: object
 *                   properties:
 *                     progress:
 *                       type: string
 *                       description: 지지난 주의 성과율 (퍼센트)
 *                 maxFailedRoutine:
 *                   type: object
 *                   description: 지난 주와 지지난 주에 가장 많이 실패한 루틴 정보
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: 루틴 ID
 *                     goal:
 *                       type: string
 *                       description: 루틴 목표
 *                 routineWeeklyReport:
 *                   type: object
 *                   description: 가장 많이 실패한 루틴에 대한 주간 보고서
 *                   additionalProperties:
 *                     type: string
 *                     description: 각 날짜별 루틴 상태 ('달성', '실패', '건너뜀', '생성되지 않음')
 *       500:
 *         description: 서버 오류
 */
