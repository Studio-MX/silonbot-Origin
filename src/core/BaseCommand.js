import {SlashCommandBuilder} from 'discord.js';
import {requireTextChannel} from '../utils/command.utils';
export class BaseCommand {
    data;
    requiresTextChannel;
    constructor(options) {
        this.data = new SlashCommandBuilder().setName(options.name).setDescription(options.description);
        this.requiresTextChannel = options.requiresTextChannel ?? false;
    }
    async execute(interaction) {
        if (this.requiresTextChannel) {
            const checkResult = requireTextChannel(interaction);
            if (checkResult) return checkResult;
        }
        return this.handleCommand(interaction);
    }
}
