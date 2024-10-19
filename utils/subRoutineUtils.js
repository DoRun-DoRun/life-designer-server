import prisma from '../prisma/prismaClient.js';

export async function createSubRoutines(routineId, subRoutines) {
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
