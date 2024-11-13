import type {Client} from 'discord.js';

export default function setup(client: Client) {
    client.on('messageCreate', async (message) => {
        if (message.content === '시론아 이프') {
            await message.send('머랭!');
        }
        if (message.content === '시론아 머랭') {
            await message.send('쿠키!');
        }
        if (message.content === '시론아 크시') {
            await message.send('팀 점점 세게 소속의 자동응답기 맞나요?');
        }
    });
}
