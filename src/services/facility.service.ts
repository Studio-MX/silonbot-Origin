import {BaseFacility} from '../core/BaseFacility';
import {FishingSpot} from '../models/FishingSpot';

export class FacilityService {
    private static facilities = new Map<string, new (channelId: string) => BaseFacility>();

    static registerFacility(facilityClass: new (channelId: string) => BaseFacility): void {
        const tempFacility = new facilityClass('temp');
        this.facilities.set(tempFacility.name, facilityClass);
    }

    static getFacilityTypes(): string[] {
        return Array.from(this.facilities.keys());
    }

    static async buildFacility(channelId: string, facilityName: string): Promise<string> {
        const spot = await FishingSpot.findOne({where: {channelId}});
        if (!spot) {
            throw new Error('낚시터를 찾을 수 없습니다.');
        }

        const FacilityClass = this.facilities.get(facilityName);
        if (!FacilityClass) {
            throw new Error('존재하지 않는 시설입니다.');
        }

        const facility = new FacilityClass(channelId);

        if (spot.reputation < facility.cost) {
            throw new Error(`이 시설을 건설하려면 명성이 ${facility.cost} 이상이어야 합니다.`);
        }

        const facilities = spot.facilities as string[];
        if (facilities.includes(facilityName)) {
            throw new Error('이미 해당 시설이 존재합니다.');
        }

        await facility.onBuild();
        facilities.push(facilityName);
        spot.facilities = facilities;
        await spot.save();

        return `${facilityName}(이)가 성공적으로 건설되었습니다!`;
    }

    static async destroyFacility(channelId: string, facilityName: string): Promise<string> {
        const spot = await FishingSpot.findOne({where: {channelId}});
        if (!spot) {
            throw new Error('낚시터를 찾을 수 없습니다.');
        }

        const FacilityClass = this.facilities.get(facilityName);
        if (!FacilityClass) {
            throw new Error('존재하지 않는 시설입니다.');
        }

        const facilities = spot.facilities as string[];
        if (!facilities.includes(facilityName)) {
            throw new Error('해당 시설이 존재하지 않습니다.');
        }

        const facility = new FacilityClass(channelId);
        await facility.onDestroy();

        spot.facilities = facilities.filter((f) => f !== facilityName);
        spot.reputation += facility.cost;
        await spot.save();

        return `${facilityName}(이)가 성공적으로 철거되었습니다.`;
    }

    static getFacilityInfo(facilityName: string): BaseFacility | null {
        const FacilityClass = this.facilities.get(facilityName);
        if (!FacilityClass) {
            return null;
        }
        return new FacilityClass('temp');
    }
}
