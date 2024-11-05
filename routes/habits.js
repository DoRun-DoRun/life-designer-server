import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';
import { habitRecommended } from '../utils/gptUtils.js';

const router = express.Router();

router.post(
  '/',
  authenticateToken,
  /**
   *
   * @param {import('express').NextFunction} next
   */
  async (req, res, next) => {
    try {
      console.log(req.body);
      const goal = req.body.habitGoal;
      const category = req.body.habitCategory;

      const user = await prisma.user.findFirst({
        where: {
          id: req.user.id,
        },
      });

      const actions = await habitRecommended(user, goal, category);

      // const subRoutinesSaved = await createSubRoutines(routineId, subRoutines);
      // console.log(subRoutinesSaved);
      req.body.actions = actions;
      next();
    } catch (error) {
      console.error('Error: error at /habits');
      res.status(500).json({ error: 'Failed to create routine with gpt' });
    }
  },
  async (req, res) => {
    const { actions } = req.body;

    try {
      // res.status(204).send();
      res.json(actions);
    } catch (error) {
      console.error('Failed to create routine:', error);
      res.status(500).json({ error: 'Failed to create routine' });
    }
  }
);

export default router;
