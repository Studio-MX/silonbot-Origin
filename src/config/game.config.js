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
};
