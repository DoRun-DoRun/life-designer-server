import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  const subRoutines = req.body;

  try {
    if (subRoutines.length === 0) return res.status(400).send();

    const createdSubRoutines = await createSubRoutines(
      subRoutines[0].routineId,
      subRoutines
    );

    res.status(201).json(createdSubRoutines);
  } catch (error) {
    console.error('Failed to create subRoutines:', error);
    res.status(500).json({ error: 'Failed to create subRoutines' });
  }
});

async function createSubRoutines(routineId, subRoutines) {
  const maxIndexSubRoutine = await prisma.subRoutine.findFirst({
    where: { routineId },
    orderBy: { index: 'desc' },
    select: { index: true },
  });

  const newIndex = maxIndexSubRoutine ? maxIndexSubRoutine.index + 1 : 0;

  const createdSubRoutines = await Promise.all(
    subRoutines.map(async (subRoutine, index) => {
      const { goal, duration, emoji } = subRoutine;

      return await prisma.subRoutine.create({
        data: {
          routineId,
          goal,
          duration,
          emoji,
          index: newIndex + index,
        },
      });
    })
  );

  return createdSubRoutines;
}

router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { routineId, goal, duration, emoji, index } = req.body;

  try {
    await prisma.subRoutine.update({
      where: {
        id: parseInt(id, 10),
        isDeleted: false,
      },
      data: {
        routineId,
        goal,
        duration,
        emoji,
        index,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to update subRoutine:', error);
    res.status(500).json({ error: 'Failed to update subRoutine' });
  }
});

router.put('/order/:id', authenticateToken, async (req, res) => {
  try {
    await Promise.all(
      req.body.map(async (subRoutine) => {
        await prisma.subRoutine.update({
          where: { id: subRoutine.id },
          data: { index: subRoutine.index },
        });
      })
    );

    res.status(200).json({ message: 'SubRoutine order updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update SubRoutine order' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.subRoutine.update({
      where: {
        id: parseInt(id, 10),
        isDeleted: false,
      },
      data: {
        isDeleted: true,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete subRoutine:', error);
    res.status(500).json({ error: 'Failed to delete subRoutine' });
  }
});

export default router;
