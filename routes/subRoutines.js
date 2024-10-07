import express from 'express';
import prisma from '../prisma/prismaClient.js';
import { authenticateToken } from '../utils/authMiddleware.js';
import { createSubRoutines } from '../utils/subRoutineUtils.js';

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


// 서브루틴 수정
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { routineId, goal, duration, emoji, index } = req.body;

  try {
    // 서브루틴이 존재하고 사용자의 것인지 확인
    const subRoutine = await prisma.subRoutine.findUnique({
      where: { id: parseInt(id, 10), isDeleted: false },
      include: {
        routine: true, // routine 정보를 함께 가져옴
      },
    });

    if (!subRoutine) {
      return res.status(404).json({ error: 'SubRoutine not found' });
    }

    // 서브루틴의 루틴이 현재 사용자의 루틴이 아닌 경우
    if (subRoutine.routine.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'You are not authorized to modify this subRoutine' });
    }

    // 사용자의 서브루틴인 경우에만 업데이트 진행
    await prisma.subRoutine.update({
      where: { id: parseInt(id, 10), isDeleted: false },
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

// 서브루틴 순서 변경
router.put('/order/:id', authenticateToken, async (req, res) => {
  try {
    const subRoutinesToUpdate = req.body;

    // 각각의 서브루틴이 사용자의 것인지 확인
    for (let subRoutine of subRoutinesToUpdate) {
      const dbSubRoutine = await prisma.subRoutine.findUnique({
        where: { id: subRoutine.id },
        include: {
          routine: true,
        },
      });

      if (!dbSubRoutine || dbSubRoutine.routine.userId !== req.user.id) {
        return res
          .status(403)
          .json({ error: 'You are not authorized to modify this subRoutine' });
      }
    }

    // 사용자의 서브루틴인 경우에만 순서 업데이트 진행
    await Promise.all(
      subRoutinesToUpdate.map(async (subRoutine) => {
        await prisma.subRoutine.update({
          where: { id: subRoutine.id },
          data: { index: subRoutine.index },
        });
      })
    );

    res.status(200).json({ message: 'SubRoutine order updated successfully' });
  } catch (error) {
    console.error('Failed to update SubRoutine order:', error);
    res.status(500).json({ error: 'Failed to update SubRoutine order' });
  }
});

// 서브루틴 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // 서브루틴이 존재하고 사용자의 것인지 확인
    const subRoutine = await prisma.subRoutine.findUnique({
      where: { id: parseInt(id, 10), isDeleted: false },
      include: {
        routine: true,
      },
    });

    if (!subRoutine) {
      return res.status(404).json({ error: 'SubRoutine not found' });
    }

    // 서브루틴의 루틴이 현재 사용자의 루틴이 아닌 경우
    if (subRoutine.routine.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'You are not authorized to delete this subRoutine' });
    }

    // 사용자의 서브루틴인 경우에만 삭제 진행
    await prisma.subRoutine.update({
      where: { id: parseInt(id, 10), isDeleted: false },
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
