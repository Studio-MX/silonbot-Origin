import {ServerList} from '../../models/ServerList';
async function UpdateServerList(client) {
    await ServerList.destroy({where: {}});
    client.guilds.cache.forEach((guild) => {
        ServerList.create({
            id: guild.id,
            name: guild.name,
        });
    });
}
export default function setup(client) {
    UpdateServerList(client);
    setInterval(() => UpdateServerList(client), 1000 * 10);
}
