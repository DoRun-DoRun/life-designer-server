/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 사용자 관련 API
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: 사용자 생성 또는 인증
 *     tags: [Users]
 *     description: 이메일과 인증 제공자를 기반으로 사용자를 생성하거나 인증합니다. 사용자가 이미 존재하고 상태가 'Delete'이면 관련 데이터를 삭제 후 새로 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 사용자의 이메일
 *               authProvider:
 *                 type: string
 *                 description: 인증 제공자
 *     responses:
 *       200:
 *         description: 생성된 또는 인증된 사용자의 액세스 및 리프레시 토큰 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT 액세스 토큰
 *                 refreshToken:
 *                   type: string
 *                   description: JWT 리프레시 토큰
 *       500:
 *         description: 서버 오류
 *     security: []
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: 현재 인증된 사용자 정보 가져오기
 *     tags: [Users]
 *     description: 인증된 사용자의 정보를 가져옵니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 인증된 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 사용자 ID
 *                 email:
 *                   type: string
 *                   description: 사용자 이메일
 *                 name:
 *                   type: string
 *                   description: 사용자 이름
 *       401:
 *         description: 인증되지 않은 사용자
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /users:
 *   put:
 *     summary: 사용자 정보 업데이트
 *     tags: [Users]
 *     description: 현재 인증된 사용자의 정보를 업데이트합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 사용자 이름
 *               age:
 *                 type: string
 *                 description: 사용자 나이
 *               job:
 *                 type: string
 *                 description: 사용자 직업
 *               challenges:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 사용자가 직면한 도전과제들
 *               gender:
 *                 type: string
 *                 description: 사용자 성별
 *     responses:
 *       200:
 *         description: 업데이트된 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 사용자 ID
 *                 name:
 *                   type: string
 *                   description: 사용자 이름
 *                 age:
 *                   type: integer
 *                   description: 사용자 나이
 *                 job:
 *                   type: string
 *                   description: 사용자 직업
 *       401:
 *         description: 인증되지 않은 사용자
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /users/withdraw:
 *   put:
 *     summary: 사용자 탈퇴
 *     tags: [Users]
 *     description: 현재 인증된 사용자의 상태를 'Delete'로 변경하여 탈퇴 처리합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 탈퇴 처리된 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 사용자 ID
 *                 memberStatus:
 *                   type: string
 *                   description: 사용자의 상태
 *                 deletedAt:
 *                   type: string
 *                   format: date-time
 *                   description: 사용자 탈퇴 처리 시간
 *       401:
 *         description: 인증되지 않은 사용자
 *       500:
 *         description: 서버 오류
 */
