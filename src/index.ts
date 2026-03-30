import { Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { handleInteraction } from './handlers/interactions.js';

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('clientReady', (readyClient) => {
    console.log(`ViviTorr is online as ${readyClient.user.tag}`);
});

client.on('interactionCreate', handleInteraction);

client.login(env.DISCORD_TOKEN);
