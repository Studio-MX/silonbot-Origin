import {ActionRowBuilder, ActivityType, ButtonBuilder, ButtonStyle, EmbedBuilder} from 'discord.js';
import {fishingService} from '../services/fishing.service';
import {User} from '../../models/User';
import {handleButtonInteraction} from './choice-game.command';
import {rateNames} from '../types';
import {UpdateBotState} from '../events/updateBotState';
export async function handleFishingInteraction(interaction) {
    if (!interaction.isButton()) return;
    const {customId} = interaction;
    switch (customId) {
        case 'catch_fish':
            const state = fishingService.getFishingState(interaction.user.id);
            if (!state) return;
            if (state.userId !== state.userId) {
                const warningEmbed = new EmbedBuilder().setColor('#ffcc00').setTitle('경고').setDescription('다른 사람의 낚시를 건드리면 안되죠!');
                await interaction.reply({
                    embeds: [warningEmbed],
                    ephemeral: true,
                });
                return;
            }
            const result = await fishingService.checkCatch(interaction.user.id);
            if (result.success && result.fish) {
                fishingService.clearTimer(interaction.user.id);
                let user = await User.findOne({where: {id: interaction.user.id}});
                if (!user) {
                    user = await User.create({
                        id: interaction.user.id,
                        username: interaction.user.username,
                        fishCaught: 0,
                        money: 0,
                    });
                }
                const earnedMoney = result.fish.price;
                const {finalPrice, feeAmount} = await fishingService.handleFishingReward(interaction.user.id, state.channelId, earnedMoney);
                await fishingService.updateFishingSpotReputation(state.channelId, earnedMoney);
                user.fishCaught++;
                user.money += finalPrice;
                user.totalAssets += finalPrice;
                await user.save();
                if (earnedMoney > 0) {
                    if (result.fish.type === 'trash') {
                        const trashEmbed = new EmbedBuilder()
                            .setColor(0x00ae86)
                            .setTitle(`🗑️ 쓰레기 ${result.fish.name}(을)를 낚았습니다!`)
                            .setDescription('이 쓰레기는 팔 수 있는 쓰레기입니다.')
                            .addFields(
                                ...[
                                    {name: '판매가', value: `${earnedMoney.toFixed(0)}원`, inline: true},
                                    feeAmount > 0
                                        ? {
                                              name: '수수료',
                                              value: `-${feeAmount}원 (-${((feeAmount / earnedMoney) * 100).toFixed(0)}%)`,
                                              inline: true,
                                          }
                                        : null,
                                    {name: '최종 획득', value: `${finalPrice.toFixed(0)}원`, inline: true},
                                    {name: '현재 보유금액', value: `${user.money.toFixed(0)}원`},
                                ].filter((field) => field !== null),
                            )
                            .setFooter({
                                text: `@<${interaction.user.id}>`,
                            })
                            .setTimestamp();
                        await interaction.update({
                            content: '',
                            embeds: [trashEmbed],
                            components: [],
                        });
                    } else {
                        const fishEmbed = new EmbedBuilder()
                            .setColor(result.fish.rate === 'legendary' || result.fish.rate === 'ultra-legendary' ? 0xffea00 : 0x00ae86)
                            .setTitle(`🐟 ${result.fish.name}을(를) 잡았습니다!`)
                            .addFields([
                                {
                                    name: '등급',
                                    value: `${rateNames[result.fish.rate || 'common']}`,
                                    inline: true,
                                },
                                {
                                    name: '크기',
                                    value: `${result.fish.length?.toFixed(2)}cm`,
                                    inline: true,
                                },
                            ])
                            //.addFields({name: '\u200b', value: '\u200b'})
                            .addFields(
                                [
                                    {name: '판매가', value: `${earnedMoney?.toFixed(0)}원`, inline: true},
                                    feeAmount > 0
                                        ? {
                                              name: '수수료',
                                              value: `-${feeAmount}원 (-${((feeAmount / earnedMoney) * 100).toFixed(0)}%)`,
                                              inline: true,
                                          }
                                        : null,
                                    {name: '최종 획득', value: `${finalPrice?.toFixed(0)}원`, inline: true},
                                ].filter((field) => field !== null),
                            )
                            .setFooter({
                                text: `@<${interaction.user.id}>`,
                            })
                            .setTimestamp();
                        await interaction.update({
                            content: '',
                            embeds: [fishEmbed],
                            components: [],
                        });
                        if (result.fish.rate === 'legendary' || result.fish.rate === 'ultra-legendary') {
                            const message = await interaction.fetchReply();
                            if (message.pinnable) {
                                try {
                                    await message.pin();
                                } catch (err) {}
                            }
                            UpdateBotState('전설 낚았다! ' + result.fish.name + ' 낚시', ActivityType.Playing);
                        }
                    }
                    fishingService.endFishing(interaction.user.id);
                } else {
                    const trashButtons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('trash_throw').setLabel('그냥 버리기').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('trash_process').setLabel('처리하기').setStyle(ButtonStyle.Primary),
                    );
                    const trashEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🗑️ 쓰레기를 낚았습니다...')
                        .setDescription(`${result.fish.name}을(를) 낚았습니다.`)
                        .addFields({name: '처리 비용', value: `${Math.abs(earnedMoney).toFixed(0)}원`});
                    await interaction.update({
                        content: '',
                        embeds: [trashEmbed],
                        components: [trashButtons],
                    });
                    state.timers.push(
                        setTimeout(async () => {
                            await handleTrashDecision(interaction, 'trash_throw');
                        }, 10000),
                    );
                }
            } else {
                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xacacac)
                            .setTitle('낚시 실패')
                            .setDescription(result.reason || '아쉽게도 물고기가 도망갔어요... 😢'),
                    ],
                    content: '',
                    components: [],
                });
                fishingService.endFishing(interaction.user.id);
            }
            break;
        case 'trash_throw':
        case 'trash_process':
            await handleTrashDecision(interaction, customId);
            break;
        default:
            await handleButtonInteraction(interaction);
            break;
    }
}
async function handleTrashDecision(interaction, decision) {
    const state = fishingService.getFishingState(interaction.user.id);
    if (!state || !state.fishType) return;
    const trashPrice = Math.abs(state.fishType.price);
    const user = await User.findOne({where: {id: interaction.user.id}});
    if (!user) return;
    const spot = await fishingService.getFishingSpot(state.channelId);
    if (!spot) return;
    const embed = new EmbedBuilder().setColor(decision === 'trash_throw' ? '#ff0000' : 0x00ae86);
    if (decision === 'trash_throw') {
        spot.cleanliness -= ~~(trashPrice * 0.1);
        await spot.save();
        embed
            .setTitle(`🗑️ 쓰레기 ${state.fishType.name}를 버렸습니다`)
            .addFields({name: '상태', value: '낚시터가 더러워졌습니다'}, {name: '현재 낚시터 청결도', value: `${spot.cleanliness}`});
    } else {
        user.money -= trashPrice;
        user.totalAssets -= trashPrice;
        await user.save();
        spot.cleanliness += ~~(trashPrice * 0.1);
        await spot.save();
        embed
            .setTitle('🗑️ 쓰레기를 처리했습니다')
            .addFields(
                {name: '처리 비용', value: `${trashPrice.toFixed(0)}원`},
                {name: '현재 보유금액', value: `${user.money.toFixed(0)}원`},
                {name: '현재 낚시터 청결도', value: `${spot.cleanliness}`},
            );
    }
    await interaction.update({
        content: '',
        embeds: [embed],
        components: [],
    });
    fishingService.endFishing(interaction.user.id);
}
