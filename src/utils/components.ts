import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags
} from 'discord.js';
import type { TMDBSearchResult, TorrentResult, ContentType, SeasonInfo, EpisodeInfo } from '../types/index.js';

export function createTypeSelectButtons(): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('type_movie')
            .setLabel('Movie')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎬'),
        new ButtonBuilder()
            .setCustomId('type_tv')
            .setLabel('TV Show')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📺')
    );
}

export function createSearchModal(type: ContentType): ModalBuilder {
    const modal = new ModalBuilder()
        .setCustomId(`search_modal_${type}`)
        .setTitle(`Search ${type === 'movie' ? 'Movies' : 'TV Shows'}`);

    const queryInput = new TextInputBuilder()
        .setCustomId('search_query')
        .setLabel(`Enter ${type === 'movie' ? 'movie' : 'TV show'} name`)
        .setPlaceholder('e.g., Titanic, Breaking Bad...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(queryInput)
    );

    return modal;
}

export function createSearchResultsSelect(
    results: TMDBSearchResult[],
    type: ContentType
): ActionRowBuilder<StringSelectMenuBuilder> {
    const options = results.map(item => {
        const title = type === 'movie' ? item.title : item.name;
        const year = type === 'movie'
            ? item.release_date?.split('-')[0]
            : item.first_air_date?.split('-')[0];

        // Handle empty descriptions - Discord requires min 1 char
        const rawDescription = item.overview?.trim();
        const description = rawDescription && rawDescription.length > 0
            ? rawDescription.slice(0, 100)
            : 'No description available';

        return {
            label: `${title}${year ? ` (${year})` : ''}`.slice(0, 100),
            description,
            value: `${type}_${item.id}`
        };
    });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_content')
        .setPlaceholder('Select a title...')
        .addOptions(options);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
}

export function createSeasonSelect(seasons: SeasonInfo[]): ActionRowBuilder<StringSelectMenuBuilder> {
    const options = seasons
        .filter(s => s.season_number > 0) // Filter out specials (season 0)
        .slice(0, 25) // Discord limit
        .map(season => ({
            label: `Season ${season.season_number}`,
            description: `${season.episode_count} episodes${season.air_date ? ` • ${season.air_date.split('-')[0]}` : ''}`.slice(0, 100),
            value: `season_${season.season_number}`
        }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_season')
        .setPlaceholder('Select a season...')
        .addOptions(options);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
}

export function createEpisodeSelect(episodes: EpisodeInfo[], seasonNumber: number): ActionRowBuilder<StringSelectMenuBuilder>[] {
    const rows: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

    // Discord limits: 25 options per select menu
    // If more than 25 episodes, create multiple select menus
    const chunks: EpisodeInfo[][] = [];
    for (let i = 0; i < episodes.length; i += 25) {
        chunks.push(episodes.slice(i, i + 25));
    }

    chunks.forEach((chunk, chunkIndex) => {
        const options = chunk.map(ep => {
            const epNum = ep.episode_number.toString().padStart(2, '0');
            const label = `E${epNum}: ${ep.name}`.slice(0, 100);
            const description = ep.air_date
                ? `Aired: ${ep.air_date}`
                : `S${seasonNumber.toString().padStart(2, '0')}E${epNum}`;

            return {
                label,
                description: description.slice(0, 100),
                value: `episode_${seasonNumber}_${ep.episode_number}`
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select_episode${chunkIndex > 0 ? `_${chunkIndex}` : ''}`)
            .setPlaceholder(chunks.length > 1
                ? `Episodes ${chunk[0].episode_number}-${chunk[chunk.length - 1].episode_number}...`
                : 'Select an episode...')
            .addOptions(options);

        rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu));
    });

    return rows.slice(0, 4); // Discord max 5 rows, leave 1 for pagination if needed
}

export function createMagnetButtons(
    torrents: TorrentResult[],
    page: number,
    visibleToUserId: string
): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const buttonsPerRow = 5;
    const itemsPerPage = 10;
    const pageOffset = page * itemsPerPage;

    // Create up to 2 rows of buttons (10 total for 10 items per page)
    for (let row = 0; row < 2; row++) {
        const startIdx = row * buttonsPerRow;
        const rowTorrents = torrents.slice(startIdx, startIdx + buttonsPerRow);

        if (rowTorrents.length === 0) break;

        const buttons = rowTorrents.map((_, i) =>
            new ButtonBuilder()
                .setCustomId(`magnet_${startIdx + i}_${page}_${visibleToUserId}`)
                .setLabel(`#${pageOffset + startIdx + i + 1}`)
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🧲')
        );

        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));
    }

    return rows;
}

export function createPaginationButtons(
    visibleToUserId: string,
    currentPage: number,
    totalPages: number
): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`page_prev_${visibleToUserId}`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
        new ButtonBuilder()
            .setCustomId(`page_next_${visibleToUserId}`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage >= totalPages - 1)
    );
}

// Helper to get ephemeral flag
export const EPHEMERAL_FLAG = MessageFlags.Ephemeral;
