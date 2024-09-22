/**
 * @swagger
 * tags:
 *   name: Routines
 *   description: 루틴 관련 API
 */

/**
 * @swagger
 * /routines:
 *   get:
 *     summary: 현재 사용자의 모든 루틴 가져오기
 *     tags: [Routines]
 *     description: 현재 인증된 사용자의 모든 루틴을 조회합니다. 삭제된 루틴은 제외됩니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 루틴 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: 루틴 ID
 *                   startTime:
 *                     type: string
 *                     format: time
 *                     description: 루틴 시작 시간
 *                   isFinished:
 *                     type: boolean
 *                     description: 오늘의 루틴 완료 여부
 *                   isToday:
 *                     type: boolean
 *                     description: 오늘이 루틴에 포함되는지 여부
 *                   repeatDays:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 루틴이 반복되는 요일들
 *                   nextAvailableIn:
 *                     type: integer
 *                     description: 다음 가능한 루틴까지의 일수
 *                   name:
 *                     type: string
 *                     description: 루틴 목표
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /routines/detail/{id}:
 *   get:
 *     summary: 특정 루틴 상세 정보 조회
 *     tags: [Routines]
 *     description: 특정 루틴의 상세 정보를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 루틴의 ID
 *     responses:
 *       200:
 *         description: 루틴 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 루틴 ID
 *                 name:
 *                   type: string
 *                   description: 루틴 목표
 *                 startTime:
 *                   type: string
 *                   format: time
 *                   description: 루틴 시작 시간
 *                 isFinished:
 *                   type: boolean
 *                   description: 오늘의 루틴 완료 여부
 *                 totalDuration:
 *                   type: integer
 *                   description: 서브루틴의 총 소요 시간 (분)
 *                 notificationTime:
 *                   type: string
 *                   format: time
 *                   description: 알림 시간
 *                 repeatDays:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 루틴이 반복되는 요일들
 *                 subRoutines:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: 서브루틴 ID
 *                       goal:
 *                         type: string
 *                         description: 서브루틴 목표
 *                       duration:
 *                         type: integer
 *                         description: 서브루틴 소요 시간 (분)
 *       404:
 *         description: 루틴을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /routines:
 *   post:
 *     summary: 새로운 루틴 생성
 *     tags: [Routines]
 *     description: 새로운 루틴을 생성합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goal:
 *                 type: string
 *                 description: 루틴 목표
 *               startTime:
 *                 type: string
 *                 format: time
 *                 description: 루틴 시작 시간
 *               repeatDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 루틴이 반복되는 요일들
 *               notificationTime:
 *                 type: string
 *                 format: time
 *                 description: 알림 시간
 *               subRoutines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     goal:
 *                       type: string
 *                       description: 서브루틴 목표
 *                     duration:
 *                       type: integer
 *                       description: 서브루틴 소요 시간 (분)
 *                     emoji:
 *                       type: string
 *                       description: 서브루틴을 나타내는 이모지
 *     responses:
 *       204:
 *         description: 루틴 생성 성공 (내용 없음)
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /routines/detail/{id}:
 *   delete:
 *     summary: 루틴 삭제
 *     tags: [Routines]
 *     description: 특정 루틴을 삭제합니다. 실제로 데이터를 삭제하지 않고, isDeleted 플래그를 true로 설정합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 삭제할 루틴의 ID
 *     responses:
 *       204:
 *         description: 루틴 삭제 성공 (내용 없음)
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /routines:
 *   put:
 *     summary: 루틴 업데이트
 *     tags: [Routines]
 *     description: 기존 루틴의 정보를 업데이트합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               routineId:
 *                 type: integer
 *                 description: 업데이트할 루틴 ID
 *               goal:
 *                 type: string
 *                 description: 루틴 목표
 *               startTime:
 *                 type: string
 *                 format: time
 *                 description: 루틴 시작 시간
 *               repeatDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 루틴이 반복되는 요일들
 *               notificationTime:
 *                 type: string
 *                 format: time
 *                 description: 알림 시간
 *     responses:
 *       200:
 *         description: 업데이트된 루틴 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 루틴 ID
 *                 goal:
 *                   type: string
 *                   description: 루틴 목표
 *                 startTime:
 *                   type: string
 *                   format: time
 *                   description: 루틴 시작 시간
 *                 repeatDays:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 루틴이 반복되는 요일들
 *                 notificationTime:
 *                   type: string
 *                   format: time
 *                   description: 알림 시간
 *       500:
 *         description: 서버 오류
 */