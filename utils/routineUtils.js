export function isRoutineFinishedToday(routineReviews) {
  const today = new Date();
  return routineReviews.some((review) => {
    const reviewDate = new Date(review.createdAt);
    return reviewDate.toDateString() === today.toDateString();
  });
}

export function isRoutineIncluded(repeatDays) {
  const today = new Date().getDay();
  return repeatDays[today];
}

export function getNextAvailableDay(repeatDays) {
  const today = new Date().getDay();
  for (let i = 0; i < 7; i++) {
    const nextDay = (today + i) % 7;
    if (repeatDays[nextDay]) {
      return i;
    }
  }
  return 7;
}
