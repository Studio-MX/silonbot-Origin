import {ActivityType} from 'discord.js';
let client;
async function UpdateState() {
    client.user.setPresence({
        activities: [
            {
                name: `${client.guilds.cache.size}곳의 서버에서 낚시`,
                type: ActivityType.Playing,
            },
        ],
        status: 'online',
    });
}
export function UpdateBotState(name, type) {
    if (client)
        client.user.setPresence({
            activities: [
                {
                    name,
                    type,
                },
            ],
            status: 'online',
        });
}
export default function setup(_client) {
    client = _client;
    UpdateState();
    setInterval(UpdateState, 1000 * 20);
}
