import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';
import { commands } from './commands/index.js';

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

async function deploy(): Promise<void> {
    try {
        console.log('Started refreshing application (/) commands...');

        const commandData = commands.map(cmd => cmd.toJSON());

        if (env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID),
                { body: commandData }
            );
            console.log(`Successfully registered commands to guild ${env.GUILD_ID}`);
        } else {
            await rest.put(
                Routes.applicationCommands(env.CLIENT_ID),
                { body: commandData }
            );
            console.log('Successfully registered commands globally (may take up to 1 hour)');
        }
    } catch (error) {
        console.error('Failed to deploy commands:', error);
        process.exit(1);
    }
}

deploy();
