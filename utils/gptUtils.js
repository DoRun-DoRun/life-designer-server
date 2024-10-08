import OpenAI from "openai";
const openai = new OpenAI();


/**
 * @typedef {Object} _subRoutine
 * @property {string} emoji
 * @property {string} routineDetail
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
const getPrompt = (user, goal) => `
안녕하세요! 이제 당신은 루틴 전문가로서, 사용자들의 목표 달성을 돕기 위해 루틴을 설계하는 역할을 맡게 되었습니다. 당신은 API 서버이므로, 코드에 오류가 생기지 않게 정해진 응답 형식 JSON 외에는 출력하지 마세요.

사용자 정보:
- 나이: ${user.age ?? "알 수 없음"}
- 성별: ${user.gender ?? "알 수 없음"}
- 직업: ${user.job ?? "알 수 없음"}
- 겪고 있는 어려움: ${user.challenges ?? "알 수 없음"}
- 목표: ${goal ?? "알 수 없음"}

사용자의 목표 달성을 위해 필요한 운동 루틴을 5가지로 나누어 다음 형식으로 JSON 형태의 응답만 출력하세요.

응답 형식:
json
{
  "subRoutine": [
    {
      "emoji": "이모지",
      "routineDetail": "루틴 설명",
      "miniuteDuration": 시간(분 단위)
    },
    ...
  ]
}

루틴은 각각 작고 실현 가능한 단계로 구성하고, 사용자의 의욕을 돋우는 이모지를 포함해주세요. 루틴은 지속 가능하게 설정해주시고, 초보자도 따라할 수 있게 쉬운 운동부터 시작하도록 구성해주세요.
`;

/**
 * user와 goal을 받아 서브 루틴들을 생성한다.
 * @param {import("@prisma/client").User} user 
 * @param {string} goal
 * @returns 
 */
export const subRoutineRecommended = async (user, goal) => {
    console.log("[OPENAI LOG]: Request start");
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: getPrompt(user, goal)
                    }
                ],
            },
        ],
    });
    console.log("[OPENAI LOG]: Request end.", completion._request_id);

    // convert into object. if failed then try get gpt's completion again
    const str = completion.choices[0].message.content;
    const json = str.replace(/```/g, '').replace(/\\n/g, ' ').substring(4);
    /**
     * @type {_gptCompletion} obj
     */
    const obj = JSON.parse(json);
    /**
     * 1. routine 객체 생성 - get from param
     * 2. routine 객체 DB 저장 - get from param
     * 3. subRoutine 객체들 생성 
     * 4. subROutine 객체들 DB 저장
     */
    const subRoutines = obj.subRoutine.map(sr => {
        const {
            emoji,
            miniuteDuration: duration,
            routineDetail: goal ,
        } = sr;
        return {emoji, duration, goal};
    })
    
    return subRoutines;
}
// console.log(completion)

export default subRoutineRecommended;