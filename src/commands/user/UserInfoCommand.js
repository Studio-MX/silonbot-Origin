import {EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import {User} from '../../models/User';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class UserInfoCommand extends BaseCommand {
    constructor() {
        super({
            name: '사용자정보',
            description: '사용자의 정보를 확인합니다',
        });
        this.data.addUserOption((option) => option.setName('사용자').setDescription('정보를 확인할 사용자').setRequired(true));
    }
    async handleCommand(interaction) {
        const targetUser = interaction.options.getUser('사용자', true);
        let user = await User.findOne({where: {id: targetUser.id}});
        if (!user) {
            return {
                content: '해당 사용자의 정보가 없습니다.',
                success: false,
                ephemeral: true,
            };
        }
        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle(`${user.username}님의 정보`)
            .addFields(
                {name: '잡은 물고기', value: `${user.fishCaught}마리`},
                {name: '보유 금액', value: `${user.money}원`},
                {name: '총 자산', value: `총 자산: ${user.totalAssets}원`},
            )
            .setFooter({
                text: `@<${interaction.user.id}>`,
            })
            .setTimestamp();
        return {
            embeds: [embed],
            content: '',
            success: true,
        };
    }
}
commandRegistry.registerCommand(new UserInfoCommand());
