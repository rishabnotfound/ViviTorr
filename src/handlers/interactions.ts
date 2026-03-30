import type {
    ChatInputCommandInteraction,
    ButtonInteraction,
    ModalSubmitInteraction,
    StringSelectMenuInteraction,
    Interaction
} from 'discord.js';
import { MessageFlags } from 'discord.js';
import { PAGINATION } from '../config/constants.js';
import { searchContent, getDetails, getPosterUrl, getSeasons, getSeasonEpisodes } from '../services/tmdb.js';
import { searchTorrents } from '../services/torrents.js';
import {
    createTypeSelectEmbed,
    createNoResultsEmbed,
    createSearchResultsEmbed,
    createLoadingEmbed,
    createNoTorrentsEmbed,
    createTorrentsEmbed,
    createErrorEmbed,
    createSeasonSelectEmbed,
    createEpisodeSelectEmbed,
    createCreditsEmbed
} from '../utils/embeds.js';
import {
    createTypeSelectButtons,
    createSearchModal,
    createSearchResultsSelect,
    createSeasonSelect,
    createEpisodeSelect,
    createMagnetButtons,
    createPaginationButtons
} from '../utils/components.js';
import { sessions } from '../utils/session.js';
import type { ContentType, TorrentResult } from '../types/index.js';

async function handleSearchCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({
        embeds: [createTypeSelectEmbed()],
        components: [createTypeSelectButtons()],
        flags: MessageFlags.Ephemeral
    });
}

async function handleCreditsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({
        embeds: [createCreditsEmbed()]
    });
}

async function handleTypeButton(interaction: ButtonInteraction): Promise<void> {
    const type: ContentType = interaction.customId === 'type_movie' ? 'movie' : 'tv';
    await interaction.showModal(createSearchModal(type));
}

async function handleSearchModal(interaction: ModalSubmitInteraction): Promise<void> {
    const type = interaction.customId.replace('search_modal_', '') as ContentType;
    const query = interaction.fields.getTextInputValue('search_query');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const results = await searchContent(query, type);

    if (results.length === 0) {
        await interaction.editReply({
            embeds: [createNoResultsEmbed(query, type)]
        });
        return;
    }

    await interaction.editReply({
        embeds: [createSearchResultsEmbed(query, results, type)],
        components: [createSearchResultsSelect(results, type)]
    });
}

async function handleContentSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    const [type, tmdbId] = interaction.values[0].split('_') as [ContentType, string];

    await interaction.deferUpdate();

    const details = await getDetails(tmdbId, type);
    const imdbId = details.external_ids?.imdb_id;
    const title = type === 'movie' ? details.title! : details.name!;
    const posterUrl = getPosterUrl(details.poster_path);

    if (!imdbId) {
        await interaction.editReply({
            embeds: [createErrorEmbed('Could not find IMDB ID for this title. Torrents may not be available.')],
            components: []
        });
        return;
    }

    if (type === 'tv') {
        const seasons = getSeasons(details);

        if (seasons.length === 0) {
            await interaction.editReply({
                embeds: [createErrorEmbed('No seasons found for this TV show.')],
                components: []
            });
            return;
        }

        sessions.setUserSession(interaction.user.id, {
            tmdbId,
            imdbId,
            title,
            posterUrl,
            type: 'tv',
            seasons
        });

        await interaction.editReply({
            embeds: [createSeasonSelectEmbed(title, posterUrl, seasons.length)],
            components: [createSeasonSelect(seasons)]
        });
        return;
    }

    // For movies, fetch torrents directly
    await interaction.editReply({
        embeds: [createLoadingEmbed(title, posterUrl)],
        components: []
    });

    const torrents = await searchTorrents(imdbId);

    // Delete the ephemeral loading message and send public results
    await interaction.deleteReply();
    await sendPublicTorrentResults(interaction, title, torrents, posterUrl);
}

async function handleSeasonSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    const session = sessions.getUserSession(interaction.user.id);

    if (!session) {
        await interaction.reply({
            content: 'Session expired. Please search again.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    // Parse: season_<seasonNum>
    const seasonNumber = parseInt(interaction.values[0].split('_')[1], 10);

    await interaction.deferUpdate();

    // Fetch episode details with titles
    const episodes = await getSeasonEpisodes(session.tmdbId, seasonNumber);

    session.selectedSeason = seasonNumber;
    session.episodes = episodes;
    sessions.setUserSession(interaction.user.id, session);

    const episodeSelectRows = createEpisodeSelect(episodes, seasonNumber);

    await interaction.editReply({
        embeds: [createEpisodeSelectEmbed(session.title, seasonNumber, episodes, session.posterUrl)],
        components: episodeSelectRows
    });
}

async function handleEpisodeSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    const session = sessions.getUserSession(interaction.user.id);

    if (!session) {
        await interaction.reply({
            content: 'Session expired. Please search again.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    // Parse: episode_<seasonNum>_<episodeNum>
    const parts = interaction.values[0].split('_');
    const seasonNumber = parts[1];
    const episodeNumber = parts[2];

    // Find episode title
    const episode = session.episodes?.find(ep => ep.episode_number === parseInt(episodeNumber, 10));
    const episodeTitle = episode?.name ? ` "${episode.name}"` : '';

    const formattedTitle = `${session.title} S${seasonNumber.padStart(2, '0')}E${episodeNumber.padStart(2, '0')}${episodeTitle}`;

    await interaction.deferUpdate();

    await interaction.editReply({
        embeds: [createLoadingEmbed(formattedTitle, session.posterUrl)],
        components: []
    });

    const torrents = await searchTorrents(session.imdbId, seasonNumber, episodeNumber);

    // Delete the ephemeral loading message and send public results
    await interaction.deleteReply();
    await sendPublicTorrentResults(interaction, formattedTitle, torrents, session.posterUrl);

    sessions.deleteUserSession(interaction.user.id);
}

async function sendPublicTorrentResults(
    interaction: ModalSubmitInteraction | StringSelectMenuInteraction,
    title: string,
    torrents: TorrentResult[],
    posterUrl: string | null
): Promise<void> {
    if (torrents.length === 0) {
        await interaction.followUp({
            embeds: [createNoTorrentsEmbed(title, posterUrl)]
        });
        return;
    }

    const totalPages = Math.ceil(torrents.length / PAGINATION.ITEMS_PER_PAGE);
    const currentPage = 0;
    const pageTorrents = torrents.slice(0, PAGINATION.ITEMS_PER_PAGE);

    sessions.setTorrentSession(interaction.user.id, {
        torrents,
        pages: chunkArray(torrents, PAGINATION.ITEMS_PER_PAGE),
        currentPage,
        title,
        posterUrl
    });

    const magnetButtonRows = createMagnetButtons(pageTorrents, currentPage, interaction.user.id);

    // Send as public message (not ephemeral)
    await interaction.followUp({
        embeds: [createTorrentsEmbed(title, torrents, currentPage, totalPages, torrents.length, posterUrl)],
        components: [
            ...magnetButtonRows,
            createPaginationButtons(interaction.user.id, currentPage, totalPages)
        ]
    });
}

async function handleMagnetButton(interaction: ButtonInteraction): Promise<void> {
    const parts = interaction.customId.split('_');
    const index = parseInt(parts[1], 10);
    const page = parseInt(parts[2], 10);
    const visibleToUserId = parts[3];

    const session = sessions.getTorrentSession(visibleToUserId);

    if (!session) {
        await interaction.reply({
            content: 'Session expired. Please search again.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const torrent = session.pages[page]?.[index];

    if (!torrent) {
        await interaction.reply({
            content: 'Torrent not found.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    // Magnet link response is ephemeral (only visible to the user who clicked)
    await interaction.reply({
        content: `**${torrent.title}**\n\n📊 Quality: \`${torrent.quality}\`\n👤 Seeders: \`${torrent.seeders}\`\n💾 Size: \`${torrent.size}\`\n🔗 Source: ${torrent.source}\n\n**Magnet Link:**\n\`\`\`\n${torrent.magnetURI}\n\`\`\``,
        flags: MessageFlags.Ephemeral
    });
}

async function handlePaginationButton(interaction: ButtonInteraction): Promise<void> {
    const visibleToUserId = interaction.customId.split('_')[2];
    const session = sessions.getTorrentSession(visibleToUserId);

    if (!session) {
        await interaction.reply({
            content: 'Session expired. Please search again.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    // Only allow the original user to paginate
    if (interaction.user.id !== visibleToUserId) {
        await interaction.reply({
            content: 'Only the person who searched can navigate pages.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const direction = interaction.customId.includes('prev') ? -1 : 1;
    session.currentPage += direction;

    const totalPages = session.pages.length;
    const pageTorrents = session.pages[session.currentPage];

    const magnetButtonRows = createMagnetButtons(pageTorrents, session.currentPage, visibleToUserId);

    await interaction.update({
        embeds: [createTorrentsEmbed(
            session.title,
            session.torrents,
            session.currentPage,
            totalPages,
            session.torrents.length,
            session.posterUrl
        )],
        components: [
            ...magnetButtonRows,
            createPaginationButtons(visibleToUserId, session.currentPage, totalPages)
        ]
    });
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export async function handleInteraction(interaction: Interaction): Promise<void> {
    try {
        // Slash commands
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'search') {
                await handleSearchCommand(interaction);
            } else if (interaction.commandName === 'credits') {
                await handleCreditsCommand(interaction);
            }
            return;
        }

        // Buttons
        if (interaction.isButton()) {
            const customId = interaction.customId;

            if (customId.startsWith('type_')) {
                await handleTypeButton(interaction);
            } else if (customId.startsWith('magnet_')) {
                await handleMagnetButton(interaction);
            } else if (customId.startsWith('page_')) {
                await handlePaginationButton(interaction);
            }
            return;
        }

        // Modals
        if (interaction.isModalSubmit()) {
            const customId = interaction.customId;

            if (customId.startsWith('search_modal_')) {
                await handleSearchModal(interaction);
            }
            return;
        }

        // Select menus
        if (interaction.isStringSelectMenu()) {
            const customId = interaction.customId;

            if (customId === 'select_content') {
                await handleContentSelect(interaction);
            } else if (customId === 'select_season') {
                await handleSeasonSelect(interaction);
            } else if (customId.startsWith('select_episode')) {
                await handleEpisodeSelect(interaction);
            }
            return;
        }
    } catch (error) {
        console.error('Interaction error:', error);

        const errorEmbed = createErrorEmbed('An error occurred. Please try again.');

        try {
            if (interaction.isRepliable()) {
                if ('deferred' in interaction && (interaction.deferred || interaction.replied)) {
                    await interaction.editReply({ embeds: [errorEmbed], components: [] });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                }
            }
        } catch (replyError) {
            console.error('Failed to send error response:', replyError);
        }
    }
}
