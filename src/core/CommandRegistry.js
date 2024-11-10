import {REST, Routes} from 'discord.js';
export class CommandRegistry {
    static instance;
    commands = new Map();
    constructor() {}
    static getInstance() {
        if (!CommandRegistry.instance) {
            CommandRegistry.instance = new CommandRegistry();
        }
        return CommandRegistry.instance;
    }
    registerCommand(command) {
        this.commands.set(command.data.name, command);
    }
    getCommand(name) {
        return this.commands.get(name);
    }
    getAllCommands() {
        return Array.from(this.commands.values());
    }
    async registerWithClient(client, token) {
        const rest = new REST().setToken(token);
        const commandData = this.getAllCommands().map((cmd) => cmd.data.toJSON());
        try {
            console.log('Started refreshing application (/) commands.');
            await rest.put(Routes.applicationCommands(client.user?.id || ''), {body: commandData});
            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error refreshing commands:', error);
        }
    }
}
