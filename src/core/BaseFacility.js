import {FishingSpot} from '../models/FishingSpot';
export class BaseFacility {
    channelId;
    constructor(channelId) {
        this.channelId = channelId;
    }
    async getSpot() {
        return await FishingSpot.findOne({where: {channelId: this.channelId}});
    }
    adjustFishChance(fish, cleanliness) {}
    adjustEscapeChance(currentChance) {
        return currentChance;
    }
    adjustReputationMultiplier(currentReputationMultiplier) {
        return currentReputationMultiplier;
    }
    async onBuild() {
        const spot = await this.getSpot();
        if (!spot) throw new Error('낚시터를 찾을 수 없습니다.');
    }
    async onDestroy() {
        const spot = await this.getSpot();
        if (!spot) throw new Error('낚시터를 찾을 수 없습니다.');
    }
}
