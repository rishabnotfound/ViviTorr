import { Client, GatewayIntentBits, ActivityType, PresenceUpdateStatus } from 'discord.js';
import { env } from './config/env.js';
import { handleInteraction } from './handlers/interactions.js';
import { cache } from './services/cache.js';

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Status rotation
const STATUS_INTERVAL = 30000; // 30 seconds
let statusIndex = 0;

function getStatusMessages(): { name: string; type: ActivityType }[] {
    const serverCount = client.guilds.cache.size;
    const memberCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

    return [
        { name: `${serverCount} servers`, type: ActivityType.Watching },
        { name: `${memberCount.toLocaleString()} users`, type: ActivityType.Watching },
        { name: '/search for torrents', type: ActivityType.Listening },
        { name: 'movies & TV shows', type: ActivityType.Streaming },
    ];
}

function updateStatus(): void {
    const statuses = getStatusMessages();
    const status = statuses[statusIndex % statuses.length];

    client.user?.setPresence({
        status: PresenceUpdateStatus.DoNotDisturb,
        activities: [{
            name: status.name,
            type: status.type
        }]
    });

    statusIndex++;
}

client.once('clientReady', (readyClient) => {
    console.log(`ViviTorr is online as ${readyClient.user.tag}`);

    // Set initial status
    updateStatus();

    // Rotate status every 30 seconds
    setInterval(updateStatus, STATUS_INTERVAL);
});

client.on('interactionCreate', handleInteraction);

// Connect to Redis then start bot
cache.connect().then(() => {
    client.login(env.DISCORD_TOKEN);
});
