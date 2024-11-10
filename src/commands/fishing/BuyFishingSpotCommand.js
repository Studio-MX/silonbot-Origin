import {EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import {fishingService} from '../../services/fishing.service';
import {CommandRegistry} from '../../core/CommandRegistry';
const commandRegistry = CommandRegistry.getInstance();
export class BuyFishingSpotCommand extends BaseCommand {
    constructor() {
        super({
            name: '낚시터매입',
            description: '현재 채널의 낚시터를 매입합니다',
            requiresTextChannel: true,
        });
    }
    async handleCommand(interaction) {
        const result = await fishingService.buyFishingSpot(interaction.channelId, interaction.user.id);
        if (!result.success) {
            return {
                content: result.error || '',
                success: false,
                ephemeral: true,
            };
        }
        const spot = await fishingService.getFishingSpot(interaction.channelId);
        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle(`낚시터 매입`)
            .setDescription('낚시터를 매입했습니다!')
            .addFields({name: '매입가', value: spot?.minPurchasePrice + '원'}, {name: '수수료', value: `${spot?.fee}%`})
            .setFooter({
                text: `@<${interaction.user.id}>`,
            })
            .setTimestamp();
        return {
            content: '',
            embeds: [embed],
            success: true,
        };
    }
}
commandRegistry.registerCommand(new BuyFishingSpotCommand());
