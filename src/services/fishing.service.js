import {gameConfig} from '../config/game.config';
import {FishingSpot} from '../models/FishingSpot';
import {User} from '../models/User';
import {FishingHistory} from '../models/FishingHistory';
import {FacilityService} from './facility.service';
import {deepCopy} from '../utils/deepCopy.util';
class FishingService {
    fishingStates = new Map();
    getRandomFish(terrain, facilities, cleanliness) {
        let terrainFishs = gameConfig.terrains[terrain]?.fishTypes;
        if (!terrainFishs) terrainFishs = gameConfig.terrains[0].fishTypes;
        terrainFishs = deepCopy(terrainFishs);
        const random = Math.random();
        let allChance = 0;
        for (const fish of terrainFishs) {
            for (const facilityName of facilities) {
                const facility = FacilityService.getFacilityInfo(facilityName);
                if (facility) facility.adjustFishChance(fish, cleanliness);
            }
            allChance += fish.chance;
        }
        let cumulativeChance = 0;
        for (const fish of terrainFishs) {
            cumulativeChance += fish.chance / allChance;
            if (random <= cumulativeChance) {
                if (fish.length) {
                    fish.length = fish.length * 0.8 + Math.random() * fish.length * 0.2;
                } else {
                    fish.length = 10 + Math.random() * 100;
                }
                if (gameConfig.priceVariation) {
                    const variation = (Math.random() * 2 - 1) * gameConfig.priceVariation;
                    fish.price = Math.floor(fish.price * (1 + variation));
                }
                return fish;
            }
        }
        return terrainFishs[Math.floor(random * terrainFishs.length)];
    }
    getRandomFishBiteTime() {
        const {min, max} = gameConfig.fishBiteTime;
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    getRandomWaitTime() {
        const {min, max} = gameConfig.fishWaitTime;
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    async createFishingSpot(channelId, minPurchasePrice) {
        return await FishingSpot.create({
            channelId,
            reputation: 0,
            cleanliness: 0,
            fee: 0,
            facilities: [],
            minPurchasePrice,
            ownerId: null,
            isPurchaseDisabled: false,
        });
    }
    async getFishingSpot(channelId) {
        return await FishingSpot.findOne({where: {channelId}});
    }
    async togglePurchaseDisabled(channelId) {
        const spot = await this.getFishingSpot(channelId);
        if (!spot) {
            return {success: false, error: '이 채널은 낚시터가 아닙니다!'};
        }
        spot.isPurchaseDisabled = !spot.isPurchaseDisabled;
        await spot.save();
        return {
            success: true,
            isDisabled: spot.isPurchaseDisabled,
        };
    }
    async buyFishingSpot(channelId, userId) {
        const spot = await this.getFishingSpot(channelId);
        if (!spot) {
            return {success: false, error: '이 채널은 낚시터가 아니야!'};
        }
        if (spot.isPurchaseDisabled) {
            return {success: false, error: '이 낚시터는 현재 매입이 금지되어 있어!'};
        }
        if (spot.ownerId === userId) {
            return {success: false, error: '이미 너가 주인이잖아!'};
        }
        const buyer = await User.findOne({where: {id: userId}});
        if (!buyer) {
            return {success: false, error: '낚시를 적어도 한 번은 해야 해!'};
        }
        if (buyer.money < spot.minPurchasePrice) {
            return {success: false, error: `낚시터를 구매하기 위해서는 최소 ${spot.minPurchasePrice}원이 필요해!`};
        }
        if (spot.ownerId) {
            const currentOwner = await User.findOne({where: {id: spot.ownerId}});
            if (currentOwner) {
                currentOwner.money += spot.minPurchasePrice;
                currentOwner.totalAssets -= spot.minPurchasePrice;
                await currentOwner.save();
            }
        }
        buyer.money -= spot.minPurchasePrice;
        await buyer.save();
        spot.ownerId = userId;
        await spot.save();
        return {success: true};
    }
    async setFishingSpotFee(channelId, userId, fee) {
        if (fee < 0 || fee > 100) {
            return {success: false, error: '수수료는 0%에서 100% 사이여야 해!'};
        }
        const spot = await this.getFishingSpot(channelId);
        if (!spot) {
            return {success: false, error: '이 채널은 낚시터가 아니야!'};
        }
        if (spot.ownerId !== userId) {
            return {success: false, error: '낚시터 주인만 수수료를 설정할 수 있어!'};
        }
        spot.fee = fee;
        await spot.save();
        return {success: true};
    }
    async setSpotTerrain(channelId, userId, terrain) {
        if (!gameConfig.terrains[terrain]) {
            return {success: false, error: '지형이 없어!'};
        }
        const spot = await this.getFishingSpot(channelId);
        if (!spot) {
            return {success: false, error: '이 채널은 낚시터가 아니야!'};
        }
        if (spot.ownerId !== userId) {
            return {success: false, error: '낚시터 주인만 지형를 설정할 수 있어!'};
        }
        spot.terrain = terrain;
        await spot.save();
        return {success: true};
    }
    async updateFishingSpotReputation(channelId, fishPrice) {
        const spot = await this.getFishingSpot(channelId);
        if (spot) {
            let reputationIncrease = Math.abs(fishPrice);
            let currentReputationMultiplier = 1;
            for (const facilityName of spot.facilities) {
                const facility = FacilityService.getFacilityInfo(facilityName);
                if (facility) currentReputationMultiplier = facility.adjustReputationMultiplier(currentReputationMultiplier);
            }
            reputationIncrease *= currentReputationMultiplier;
            spot.reputation += reputationIncrease;
            await spot.save();
        }
    }
    async startFishing(userId, channelId) {
        const spot = await this.getFishingSpot(channelId);
        if (!spot) {
            return {success: false, error: '이 채널은 낚시터가 아니야!'};
        }
        const waitTime = this.getRandomWaitTime();
        const biteTime = this.getRandomFishBiteTime();
        const fishType = this.getRandomFish(spot.terrain, spot.facilities, spot.cleanliness);
        const state = {
            isActive: true,
            startTime: Date.now(),
            waitTime,
            biteTime,
            fishType,
            userId,
            channelId,
            timers: [],
        };
        this.fishingStates.set(userId, state);
        return {success: true};
    }
    async handleFishingReward(userId, channelId, fishPrice) {
        const spot = await this.getFishingSpot(channelId);
        if (!spot || fishPrice <= 0) {
            return {finalPrice: fishPrice, feeAmount: 0, ownerEarnings: 0};
        }
        const feeAmount = spot.ownerId === userId ? 0 : Math.floor((fishPrice * spot.fee) / 100);
        const finalPrice = fishPrice - feeAmount;
        if (spot.ownerId && feeAmount > 0) {
            const owner = await User.findOne({where: {id: spot.ownerId}});
            if (owner) {
                owner.money += feeAmount;
                await owner.save();
            }
        }
        return {finalPrice, feeAmount, ownerEarnings: feeAmount};
    }
    setBitedTime(userId) {
        const state = this.fishingStates.get(userId);
        if (state) {
            state.bitedAt = Date.now();
            this.fishingStates.set(userId, state);
        }
    }
    async checkCatch(userId) {
        const state = this.fishingStates.get(userId);
        if (!state || !state.isActive || !state.fishType) {
            return {success: false};
        }
        if (!state.bitedAt || Date.now() - state.bitedAt < gameConfig.minCatchTime) {
            return {
                success: false,
                reason: '찌를 올렸지만 아무 것도 없었다...',
            };
        }
        let escapeChance = gameConfig.fishEscapeChance;
        const spot = await this.getFishingSpot(state.channelId);
        if (spot) {
            for (const facilityName of spot.facilities) {
                const facility = FacilityService.getFacilityInfo(facilityName);
                if (facility) {
                    escapeChance *= facility.adjustEscapeChance(escapeChance);
                }
            }
        }
        if (Math.random() < escapeChance) {
            return {
                success: false,
                reason: '물고기가 떠나가 버렸다...',
            };
        }
        if (state.fishType) {
            await FishingHistory.create({
                userId: state.userId,
                channelId: state.channelId,
                fishName: state.fishType.name,
                fishType: state.fishType.type,
                fishRate: state.fishType.rate,
                length: state.fishType.length,
                price: state.fishType.price,
            });
        }
        return {
            success: true,
            fish: state.fishType,
        };
    }
    getFishingState(userId) {
        return this.fishingStates.get(userId);
    }
    clearTimer(userId) {
        const state = this.fishingStates.get(userId);
        if (state) {
            for (const timer of state.timers) clearTimeout(timer);
        }
    }
    endFishing(userId) {
        this.clearTimer(userId);
        this.fishingStates.delete(userId);
    }
    isFishing(userId) {
        return this.fishingStates.has(userId);
    }
}
export const fishingService = new FishingService();
