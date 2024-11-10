export default function setup(client) {
    client.on('messageCreate', async (message) => {
        if (message.content === '시론아 이프') {
            await message.reply('머랭!');
        }
        if (message.content === '시론아 머랭') {
            await message.reply('쿠키!');
        }
    });
}
