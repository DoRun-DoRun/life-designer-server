import OpenAI from 'openai';
const openai = new OpenAI();

/**
 * @typedef {Object} _subRoutine
 * @property {string} emoji
 * @property {string} routine
 * @property {string} miniuteDuration
 */

/**
 * @typedef {Object} _gptCompletion
 * @property {_subRoutine[]} subRoutine
 */

/**
 *
 * @param {import("@prisma/client").User} user
 * @param {string} goal
 * @returns
 */
const getPrompt = (user, goal) => {
  const defaultValue = '알 수 없음';
  return `
    안녕하세요! 당신은 이제 루틴 전문가가 되어 사용자들의 목표 달성을 돕는 루틴을 설계하는 역할을 맡고 있습니다. 당신은 API 서버이므로, 정해진 JSON 형식 외의 응답은 하지 마세요.
  
    사용자 정보:
    - 나이: ${user.age ?? defaultValue}
    - 성별: ${user.gender ?? defaultValue}
    - 직업: ${user.job ?? defaultValue}
    - 겪고 있는 어려움: ${user.challenges ?? defaultValue}
    - 목표: ${goal ?? defaultValue}
  
    사용자의 목표 달성을 위해 아래의 형식을 따르는 루틴 5가지를 JSON 형태로 출력하세요.
  
    응답 형식:
    {
      "subRoutine": [
        {
          "emoji": "이모지",
          "routine": "20자 이내의 직관적인 루틴 설명 (예: OO하기)",
          "secondDuration": 시간(초 단위)
        },
        ...
      ]
    }
  
    목표: "상쾌한 아침 시작"의 예시 응답:
    {
      "subRoutine": [
        { "emoji": "🧘", "routine": "기지개 켜기", "secondDuration": 300 },
        { "emoji": "💧", "routine": "물 한 컵 마시기", "secondDuration": 180 },
        { "emoji": "🌬️", "routine": "깊은 호흡하기", "secondDuration": 300 },
        { "emoji": "🤸", "routine": "간단한 스트레칭", "secondDuration": 600 }
      ]
    }
    `;
};

/**
 * user와 goal을 받아 서브 루틴들을 생성한다.
 * @param {import("@prisma/client").User} user
 * @param {string} goal
 * @returns
 */
export const subRoutineRecommended = async (user, goal) => {
  console.log('[OPENAI LOG]: Request start');
  const completion = await openai.chat.completions.create({
    model: 'gpt-4', // 올바른 모델 이름 사용
    messages: [
      {
        role: 'user',
        content: getPrompt(user, goal), // 문자열로 전달
      },
    ],
  });
  console.log('[OPENAI LOG]: Request end.', completion._request_id);
  console.log('[OPENAI LOG]: Data.', completion.choices);

  let json;
  try {
    json = JSON.parse(
      completion.choices[0].message.content.replace(/```(json)?/g, '').trim()
    );
  } catch (error) {
    console.error('Failed to parse JSON from GPT response:', error.message);
    throw new Error('Invalid JSON response received from GPT.');
  }

  if (!json || !Array.isArray(json.subRoutine)) {
    throw new Error('Invalid response format received from GPT.');
  }

  const subRoutines = json.subRoutine.map((sr) => {
    const { emoji, secondDuration: duration, routine: goal } = sr;
    return { emoji, duration, goal };
  });

  return subRoutines;
};

// console.log(completion)

export default subRoutineRecommended;
