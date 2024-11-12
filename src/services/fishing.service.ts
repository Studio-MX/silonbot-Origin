import type {FishType, FishingState} from '../types';
import {gameConfig} from '../config/game.config';
import {FishingSpot} from '../models/FishingSpot';
import {User} from '../models/User';
import {FishingHistory} from '../models/FishingHistory';
import {FacilityService} from './facility.service';
import {deepCopy} from '../utils/deepCopy.util';

class FishingService {
    private fishingStates: Map<string, FishingState> = new Map();

    private getRandomFish(terrain: number, facilities: string[], cleanliness: number): FishType | null {
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

    private getRandomFishBiteTime(): number {
        const {min, max} = gameConfig.fishBiteTime;
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    private getRandomWaitTime(): number {
        const {min, max} = gameConfig.fishWaitTime;
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    async createFishingSpot(channelId: string, minPurchasePrice: number): Promise<FishingSpot> {
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

    async getFishingSpot(channelId: string): Promise<FishingSpot | null> {
        return await FishingSpot.findOne({where: {channelId}});
    }

    async togglePurchaseDisabled(channelId: string): Promise<{success: boolean; error?: string; isDisabled?: boolean}> {
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

    async buyFishingSpot(channelId: string, userId: string): Promise<{success: boolean; error?: string}> {
        const spot = await this.getFishingSpot(channelId);
        if (!spot) {
            return {success: false, error: '이 채널은 낚시터가 아닙니다!'};
        }

        if (spot.isPurchaseDisabled) {
            return {success: false, error: '이 낚시터는 현재 매입이 금지되어 있습니다!'};
        }

        if (spot.ownerId === userId) {
            return {success: false, error: '이미 당신이 주인입니다.'};
        }

        const buyer = await User.findOne({where: {id: userId}});
        if (!buyer) {
            return {success: false, error: '낚시를 적어도 한 번은 하셔야 합니다.'};
        }

        if (buyer.money < spot.minPurchasePrice) {
            return {success: false, error: `낚시터를 구매하기 위해서는 최소 ${spot.minPurchasePrice}원이 필요합니다!`};
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

    async setFishingSpotFee(channelId: string, userId: string, fee: number): Promise<{success: boolean; error?: string}> {
        if (fee < 0 || fee > 100) {
            return {success: false, error: '수수료는 0%에서 100% 사이여야 합니다!'};
        }

        const spot = await this.getFishingSpot(channelId);
        if (!spot) {
            return {success: false, error: '이 채널은 낚시터가 아닙니다!'};
        }

        if (spot.ownerId !== userId) {
            return {success: false, error: '낚시터 주인만 수수료를 설정할 수 있습니다!'};
        }

        spot.fee = fee;
        await spot.save();

        return {success: true};
    }

    async setSpotTerrain(channelId: string, userId: string, terrain: number): Promise<{success: boolean; error?: string}> {
        if (!gameConfig.terrains[terrain]) {
            return {success: false, error: '지형이 없습니다!'};
        }

        const spot = await this.getFishingSpot(channelId);
        if (!spot) {
            return {success: false, error: '이 채널은 낚시터가 아닙니다!'};
        }

        if (spot.ownerId !== userId) {
            return {success: false, error: '낚시터 주인만 지형를 설정할 수 있습니다!'};
        }

        spot.terrain = terrain;
        await spot.save();

        return {success: true};
    }

    async updateFishingSpotReputation(channelId: string, fishPrice: number): Promise<void> {
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

    async startFishing(userId: string, channelId: string): Promise<{success: boolean; error?: string}> {
        const spot = await this.getFishingSpot(channelId);
        if (!spot) {
            return {success: false, error: '이 채널은 낚시터가 아닙니다!'};
        }

        const waitTime = this.getRandomWaitTime();
        const biteTime = this.getRandomFishBiteTime();
        const fishType = this.getRandomFish(spot.terrain, spot.facilities as string[], spot.cleanliness);

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

    async handleFishingReward(
        userId: string,
        channelId: string,
        fishPrice: number,
    ): Promise<{
        finalPrice: number;
        feeAmount: number;
        ownerEarnings: number;
    }> {
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

    setBitedTime(userId: string): void {
        const state = this.fishingStates.get(userId);
        if (state) {
            state.bitedAt = Date.now();
            this.fishingStates.set(userId, state);
        }
    }

    async checkCatch(userId: string): Promise<{
        success: boolean;
        fish?: FishType;
        reason?: string;
    }> {
        const state = this.fishingStates.get(userId);
        if (!state || !state.isActive || !state.fishType) {
            return {success: false};
        }

        if (!state.bitedAt || Date.now() - state.bitedAt < gameConfig.minCatchTime) {
            return {
                success: false,
                reason: '너무 빨리 낚싯대를 올렸습니다! 물고기가 도망갔습니다.',
            };
        }

        let escapeChance = gameConfig.fishEscapeChance;
        const spot = await this.getFishingSpot(state.channelId);
        if (spot) {
            for (const facilityName of spot.facilities as string[]) {
                const facility = FacilityService.getFacilityInfo(facilityName);
                if (facility) {
                    escapeChance *= facility.adjustEscapeChance(escapeChance);
                }
            }
        }

        if (Math.random() < escapeChance) {
            return {
                success: false,
                reason: '물고기가 도망갔습니다!',
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

    getFishingState(userId: string): FishingState | undefined {
        return this.fishingStates.get(userId);
    }

    clearTimer(userId: string): void {
        const state = this.fishingStates.get(userId);
        if (state) {
            for (const timer of state.timers) clearTimeout(timer);
        }
    }

    endFishing(userId: string): void {
        this.clearTimer(userId);
        this.fishingStates.delete(userId);
    }

    isFishing(userId: string): boolean {
        return this.fishingStates.has(userId);
    }
}

export const fishingService = new FishingService();
