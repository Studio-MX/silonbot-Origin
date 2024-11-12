import type {Client} from 'discord.js';
import {ServerList} from '../models/ServerList';

async function UpdateServerList(client: Client) {
    await ServerList.destroy({where: {}});

    client.guilds.cache.forEach((guild) => {
        ServerList.create({
            id: guild.id,
            name: guild.name,
        });
    });
}

export default function setup(client: Client) {
    UpdateServerList(client);

    setInterval(() => UpdateServerList(client), 1000 * 10);
}
