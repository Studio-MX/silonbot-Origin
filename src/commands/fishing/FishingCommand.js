import {EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import {fishingService} from '../../services/fishing.service';
import {ButtonStyle} from 'discord.js';
import {ActionRowBuilder, ButtonBuilder} from '@discordjs/builders';
import {CommandRegistry} from '../../core/CommandRegistry';
const commandRegistry = CommandRegistry.getInstance();
export class FishingCommand extends BaseCommand {
    constructor() {
        super({
            name: '낚시',
            description: '낚시를 시작합니다',
            requiresTextChannel: true,
        });
    }
    async handleCommand(interaction) {
        const userId = interaction.user.id;
        const channelId = interaction.channelId;
        if (fishingService.isFishing(userId)) {
            return {
                content: '이미 낚시중이잖아!',
                success: false,
                ephemeral: true,
            };
        }
        const startResult = await fishingService.startFishing(userId, channelId);
        if (!startResult.success) {
            return {
                content: startResult.error || '',
                success: false,
                ephemeral: true,
            };
        }
        const catchRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('catch_fish').setLabel('낚싯줄 당기기').setStyle(ButtonStyle.Primary));
        const embed = new EmbedBuilder().setTitle('낚시 시작').setDescription('낚시를 시작합니다! 🎣').setColor(0x00ae86);
        const response = await interaction.reply({
            embeds: [embed],
            components: [catchRow],
            fetchReply: true,
        });
        const state = fishingService.getFishingState(userId);
        if (!state) {
            return {
                content: '낚시를 시작할 수 없어!',
                success: false,
                ephemeral: true,
            };
        }
        const waitTime = state.waitTime;
        const biteTime = state.biteTime;
        state.timers.push(
            setTimeout(async () => {
                if (fishingService.isFishing(userId)) {
                    const biteEmbed = new EmbedBuilder().setTitle('기다리는 중').setDescription('머랭!').setColor(0x00ae86);
                    await response.edit({
                        embeds: [biteEmbed],
                        components: [catchRow],
                    });
                    state.timers.push(
                        setTimeout(async () => {
                            if (fishingService.isFishing(userId)) {
                                fishingService.setBitedTime(userId);
                                const caughtEmbed = new EmbedBuilder().setTitle('앗').setDescription('머랭!').setColor(0x00ae86);
                                await response.edit({
                                    embeds: [caughtEmbed],
                                    components: [catchRow],
                                });
                                state.timers.push(
                                    setTimeout(async () => {
                                        if (fishingService.isFishing(userId)) {
                                            fishingService.endFishing(userId);
                                            const escapeEmbed = new EmbedBuilder().setTitle('낚시 실패').setDescription('머랭!').setColor(0xff0000);
                                            await response.edit({
                                                embeds: [escapeEmbed],
                                                components: [],
                                            });
                                        }
                                    }, 5000),
                                );
                            }
                        }, biteTime),
                    );
                }
            }, waitTime),
        );
        return {
            content: '낚시를 시작합니다! 🎣',
            success: true,
        };
    }
}
commandRegistry.registerCommand(new FishingCommand());
