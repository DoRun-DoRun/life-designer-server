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
 * @param {string} habitCategory
 * @param {string[]} actions
 * @returns
 */
const getPrompt = (user, goal, habitCategory, actions) => {
  const defaultValue = '알 수 없음';
  return `
  안녕하세요! 당신은 루틴 전문가로서 사용자의 습관 형성을 돕는 루틴을 설계하는 역할을 맡고 있습니다. API 서버로서, 정해진 JSON 형식 외의 응답은 절대 하지 마세요.

  사용자 정보:
  - 나이: ${user.age ?? defaultValue}
  - 성별: ${user.gender ?? defaultValue}
  - 직업: ${user.job ?? defaultValue}
  - 습관으로 만들고자 하는 목표: ${goal ?? defaultValue}
  - 습관 카테고리: ${habitCategory ?? defaultValue}
  - 선호하는 행동(참고용): ${actions ?? defaultValue}

  사용자의 목표 달성을 위해 특정 시간대에 수행할 수 있는 연속적인 동작으로 구성된 하나의 루틴을 설계하세요. 루틴은 3~5개의 단계로 이루어져야 하며, 각 단계는 이전 단계와 자연스럽게 연결되고, 사용자의 선호 행동과 목표에 부합해야 합니다. 루틴은 시작부터 끝까지 하나의 시간대에 완료될 수 있도록 설계되어야 합니다.

  루틴 설계 시 다음 사항을 고려하세요:

  1. **실행 타이밍 인지**: 루틴이 실행될 구체적인 시간을 정하세요 (예: 기상 후, 아침 7시 등).
  2. **연속적인 행동 구성**: 각 행동은 이전 행동과 논리적으로 연결되어야 하며, 전체적으로 하나의 흐름을 만들어야 합니다.
  3. **실행 동기 판단**: 사용자가 해당 행동을 수행할 동기를 부여할 수 있도록 간단하고 직관적인 설명으로 표현하세요.
  4. **루틴의 목적**: 루틴은 하루종일 수행하는 것이 아닌 사용자로부터 특정 시간에 특정 행동을 무의식적으로 할 수 있도록 습관을 만드는 것을 목적으로 합니다.

  아래의 형식에 따라 루틴을 JSON 형태로 출력하세요.

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
      { "emoji": "⏰", "routine": "기상하기", "secondDuration": 60 },
      { "emoji": "🚿", "routine": "샤워하기", "secondDuration": 600 },
      { "emoji": "🥣", "routine": "아침 식사하기", "secondDuration": 900 },
      { "emoji": "👔", "routine": "옷 갈아입기", "secondDuration": 300 }
    ]
  }
`;
};

/**
 *
 * @param {import("@prisma/client").User} user
 * @param {string} goal
 * @param {string} category
 * @returns
 */
const getHabitPrompt = (user, goal, category) => {
  const defaultValue = '알 수 없음';
  return `
    안녕하세요! 당신은 루틴 전문가로서 사용자의 습관 형성을 돕는 행동을 추천하는 역할을 맡고 있습니다. API 서버로서, 정해진 JSON 형식 외의 응답은 절대 하지 마세요.

    사용자 정보:
    - 나이: ${user.age ?? defaultValue}
    - 성별: ${user.gender ?? defaultValue}
    - 직업: ${user.job ?? defaultValue}
    - 습관으로 만들고자 하는 목표: ${goal ?? defaultValue}
    - 습관 카테고리: ${category ?? defaultValue}

    사용자가 습관을 형성하기 위해 수행하면 좋은 행동 10가지를 아래의 지침에 따라 추천하고, 지정된 JSON 형식으로만 출력하세요:

    - 각 행동은 사용자의 목표와 카테고리에 부합해야 합니다.
    - 행동은 구체적이고 실천 가능해야 합니다.
    - 행동은 간결하고 명확하게 기술되어야 합니다.
    - 행동은 사용자가 일상에서 쉽게 적용할 수 있어야 합니다.

    응답 형식:
    {"actions": ["행동 1", "행동 2", "행동 3", "행동 4", "행동 5", "행동 6", "행동 7", "행동 8", "행동 9", "행동 10"]}

    **주의사항:**
    - 응답은 반드시 위의 JSON 형식만을 포함해야 합니다.
    - "actions" 배열에는 총 10개의 고유한 행동이 포함되어야 합니다.
    - JSON 외의 텍스트, 설명 또는 추가 정보는 포함하지 마세요.
  `;
};

/**
 * user와 goal을 받아 서브 루틴들을 생성한다.
 * @param {import("@prisma/client").User} user
 * @param {string} goal
 * @param {string} habitCategory
 * @param {string[]} actions
 * @returns
 */
export const subRoutineRecommended = async (
  user,
  goal,
  habitCategory,
  actions
) => {
  console.log('[OPENAI LOG]: Request start');
  const completion = await openai.chat.completions.create({
    model: 'gpt-4', // 올바른 모델 이름 사용
    messages: [
      {
        role: 'user',
        content: getPrompt(user, goal, habitCategory, actions), // 문자열로 전달
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

/**
 * user와 goal을 받아 서브 루틴들을 생성한다.
 * @param {import("@prisma/client").User} user
 * @param {string} goal
 * @returns
 */
export const habitRecommended = async (user, goal, category) => {
  console.log('[OPENAI LOG]: Request start');
  const completion = await openai.chat.completions.create({
    model: 'gpt-4', // 올바른 모델 이름 사용
    messages: [
      {
        role: 'user',
        content: getHabitPrompt(user, goal, category), // 문자열로 전달
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

  if (!json || !Array.isArray(json.actions) || json.actions.length !== 10) {
    throw new Error('Invalid response format received from GPT.');
  }

  return json;
};
