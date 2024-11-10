import {folderImport} from './src/utils/folder-importer.util';
await folderImport('facilities');
await folderImport('commands');
const events = await folderImport('events');
import {Client, GatewayIntentBits, Partials, Events} from 'discord.js';
import {sequelize} from './sequelize';
import {CommandRegistry} from './src/core/CommandRegistry';
import {handleFishingInteraction} from './src/commands/fishing.command';
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
const commandRegistry = CommandRegistry.getInstance();
client.once('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}`);
    await sequelize.sync();
    await commandRegistry.registerWithClient(client, process.env.DISCORD_TOKEN);
    for (const event of events) {
        if (typeof event.default === 'function') event.default(client);
    }
});
client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = commandRegistry.getCommand(interaction.commandName);
        if (command) {
            try {
                const result = await command.execute(interaction);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: result.content,
                        embeds: result.embeds || [],
                        components: result.components || [],
                        ephemeral: result.ephemeral,
                    });
                }
            } catch (error) {
                console.error(error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '명령어 실행 중 오류가 발생했습니다.',
                        ephemeral: true,
                    });
                }
            }
        }
    } else if (interaction.isButton()) {
        await handleFishingInteraction(interaction);
    }
});
client.login(process.env.DISCORD_TOKEN);
