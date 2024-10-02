/**
 * 
 * @param {import("@prisma/client").Routine} routine 
 * @param {Date} startAt 
 * @param {Date} endAt 
 */
export function getDatesBetween(routine, startAt, endAt) {
    const actionDates = [];
    const {repeatDays, startTime} = routine;

    const startAtDateOnly = getOnlyDate(startAt);
    const endAtDateOnly = getOnlyDate(endAt);

    const startDayOfWeek = startAt.getDay();
    const startSeconds = getSeconds(startAt);

    if(repeatDays[(startDayOfWeek+6)%7] && startSeconds >= startTime) {
        actionDates.push(startAtDateOnly);
    }
    let currentDate = new Date(startAt);
    currentDate.setDate(currentDate.getDate() + 1);
    while(getOnlyDate(currentDate) < endAtDateOnly) {
        const currentDayOfWeek = currentDate.getDay();

        if(repeatDays[(currentDayOfWeek+6)%7]) {
            actionDates.push(getOnlyDate(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return actionDates;
}

/**
 * 
 * @param {*[]} arr 
 * @param {*[]} brr 
 * @returns maxStreak
 */
export function getMaxStreak(arr, brr) {
    const n = arr.length;
    const m = brr.length;
    let maxStreak = 0;

    // 2D DP 배열 선언 (모두 0으로 초기화)
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            // 배열의 요소가 같으면 이전 단계(dp[i-1][j-1])에서 1을 더해 연속 부분 수열 길이를 갱신
            if (arr[i - 1] === brr[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
                maxStreak = Math.max(maxStreak, dp[i][j]); // 최대 길이 갱신
            }
        }
    }

    return maxStreak;
}


/**
 * 
 * @param {Date} date 
 */
const getSeconds = (date) => date.getHours() * 3600 + date.getMinutes * 60 + date.getSeconds();

/**
 * 
 * @param {Date} date 
 * @returns {{lastWeekEnd: Date, lastWeekStart: Date}}
 */
export const getLastWeekFrom = (date) => {
	const lastWeekEnd = new Date(date);
	lastWeekEnd.setDate(date.getDate() - date.getDay());
	lastWeekEnd.setUTCSeconds(23, 59, 59, 999);
	const lastWeekStart = new Date(lastWeekEnd);
	lastWeekStart.setDate(lastWeekEnd.getDate() - 7);
	lastWeekStart.setUTCHours(0, 0, 0, 0);
	return {lastWeekEnd, lastWeekStart};
}

/**
 * 
 * @param {Date} date 
 * @returns 날짜를 반환합니다. 'yyyy-mm-dd'
 */
export const getOnlyDate = (date) => date.toISOString().split('T')[0];