import {ChatInputCommandInteraction, EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {User} from '../../models/User';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class MyInfoCommand extends BaseCommand {
    constructor() {
        super({
            name: '내정보',
            description: '당신의 정보를 확인합니다',
        });
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        let user = await User.findOne({where: {id: interaction.user.id}});

        if (!user) {
            user = await User.create({
                id: interaction.user.id,
                username: interaction.user.username,
                fishCaught: 0,
                money: 0,
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle(`${user.username}님의 정보`)
            .addFields({name: '잡은 물고기', value: `${user.fishCaught}마리`}, {name: '보유 금액', value: `${user.money}원`}, {name: '총 자산', value: `${user.totalAssets}원`})
            .setFooter({
                text: `@${interaction.user.username}`,
            })
            .setTimestamp();

        return {
            content: '',
            embeds: [embed],
            success: true,
        };
    }
}

commandRegistry.registerCommand(new MyInfoCommand());
