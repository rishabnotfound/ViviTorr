import { SlashCommandBuilder } from 'discord.js';

export const creditsCommand = new SlashCommandBuilder()
    .setName('credits')
    .setDescription('View credits, services used, and project info');
