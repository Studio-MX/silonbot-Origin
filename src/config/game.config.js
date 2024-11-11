const ultraLegendary = [{name: '123', chance: 0.0001, price: 1000, length: 300, type: 'dino', rate: 'ultra-legendary'}];
const trashs = [{name: '낚시 바늘', chance: 0.01, price: -20, length: 5, type: 'trash'}];

export const gameConfig = {
    terrains: [
        {
            name: '바다',
            fishTypes: [{name: '고등어', chance: 0.5, price: 10, length: 60, rate: 'common'}, ...trashs, ...ultraLegendary],
        },
    ],
    fishWaitTime: {min: 2000, max: 5000},
    fishBiteTime: {min: 2000, max: 3000},
    fishEscapeChance: 0.3,
    minCatchTime: 1000,
    priceVariation: 0.7,
    fishing_wait: ['매운탕 먹고 싶다...', '이 봇은 키뮤소프트의 봇 이프의 팬 봇입니다...', '물고기를 기다리는 중입니다...', '낚시 찌는 언제 흔들릴까...'],
    fishing_fake: ['아나필락시스쇼크가 찾아왔다!!!', '개발하기 귀찮다!!!', '찌가 움직였나?!?!', '머랭!!!', '키뮤님 싫어해요!!!', 낚시대가 동요친다!!!'],
    fishing_true: ['찌가 움직였다!?!?', '낚시대가 요동친다!!!', '매우 무거운 느낌이 든다!!!', '키뮤님 사랑해요!!!'],
};
