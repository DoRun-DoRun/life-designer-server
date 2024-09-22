/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 인증 및 토큰 관련 API
 */

/**
 * @swagger
 * /auth/token:
 *   post:
 *     summary: 새 액세스 토큰 및 리프레시 토큰 발급
 *     tags: [Authentication]
 *     description: 유효한 리프레시 토큰을 기반으로 새 액세스 토큰과 리프레시 토큰을 발급합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 토큰 발급 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: 새로 발급된 액세스 토큰 (JWT)
 *                 refreshToken:
 *                   type: string
 *                   description: 새로 발급된 리프레시 토큰 (JWT)
 *       401:
 *         description: 리프레시 토큰이 유효하지 않음
 *       500:
 *         description: 서버 오류
 */
