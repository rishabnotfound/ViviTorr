import { SlashCommandBuilder } from 'discord.js';

export const helpCommand = new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all available commands');
