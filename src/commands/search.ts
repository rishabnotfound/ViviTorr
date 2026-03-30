import { SlashCommandBuilder } from 'discord.js';

export const searchCommand = new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for movie or TV show torrents');
