/**
 * @swagger
    tags:
 *   name: SubRoutine
 *   description: 서브루틴 관련 API
 */

/**
 * @swagger
 * routines/subRoutine:
 *   post:
 *     summary: 새로운 서브루틴 생성
 *     tags: [SubRoutine]
 *     description: 주어진 루틴 ID에 따라 새로운 서브루틴을 생성합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 routineId:
 *                   type: integer
 *                   description: 루틴 ID
 *                 goal:
 *                   type: string
 *                   description: 서브루틴 목표
 *                 duration:
 *                   type: integer
 *                   description: 서브루틴 소요 시간 (분)
 *                 emoji:
 *                   type: string
 *                   description: 서브루틴을 나타내는 이모지
 *     responses:
 *       201:
 *         description: 생성된 서브루틴 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: 서브루틴 ID
 *                   goal:
 *                     type: string
 *                     description: 서브루틴 목표
 *                   duration:
 *                     type: integer
 *                     description: 서브루틴 소요 시간 (분)
 *                   emoji:
 *                     type: string
 *                     description: 서브루틴을 나타내는 이모지
 *                   index:
 *                     type: integer
 *                     description: 서브루틴 순서
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * routines/subRoutine/{id}:
 *   put:
 *     summary: 서브루틴 업데이트
 *     tags: [SubRoutine]
 *     description: 기존 서브루틴의 정보를 업데이트합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 업데이트할 서브루틴의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               routineId:
 *                 type: integer
 *                 description: 루틴 ID
 *               goal:
 *                 type: string
 *                 description: 서브루틴 목표
 *               duration:
 *                 type: integer
 *                 description: 서브루틴 소요 시간 (분)
 *               emoji:
 *                 type: string
 *                 description: 서브루틴을 나타내는 이모지
 *               index:
 *                 type: integer
 *                 description: 서브루틴 순서
 *     responses:
 *       204:
 *         description: 서브루틴 업데이트 성공 (내용 없음)
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * routines/subRoutine/order/{id}:
 *   put:
 *     summary: 서브루틴 순서 업데이트
 *     tags: [SubRoutine]
 *     description: 서브루틴의 순서를 업데이트합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 서브루틴 ID
 *                 index:
 *                   type: integer
 *                   description: 새로운 순서
 *     responses:
 *       200:
 *         description: 서브루틴 순서 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * routines/subRoutine/{id}:
 *   delete:
 *     summary: 서브루틴 삭제
 *     tags: [SubRoutine]
 *     description: 서브루틴을 삭제합니다. 실제 데이터는 삭제되지 않으며, isDeleted 플래그를 true로 설정합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 삭제할 서브루틴의 ID
 *     responses:
 *       204:
 *         description: 서브루틴 삭제 성공 (내용 없음)
 *       500:
 *         description: 서버 오류
 */
