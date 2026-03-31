import { EmbedBuilder } from 'discord.js';
import { COLORS, PAGINATION } from '../config/constants.js';
import type { TorrentResult, TMDBSearchResult, ContentType, EpisodeInfo } from '../types/index.js';

const BOT_FOOTER = 'ViviTorr • Torrent Search Bot';

export function createTypeSelectEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('ViviTorr Search')
        .setDescription('Search for movies and TV shows, get magnet links with seeders, size, and quality info.\n\n**What are you looking for?**')
        .setFooter({ text: BOT_FOOTER });
}

export function createNoResultsEmbed(query: string, type: ContentType): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('No Results Found')
        .setDescription(`No ${type === 'movie' ? 'movies' : 'TV shows'} found for "${query}"`)
        .setFooter({ text: BOT_FOOTER });
}

export function createSearchResultsEmbed(
    query: string,
    results: TMDBSearchResult[],
    type: ContentType
): EmbedBuilder {
    const description = results.map((item, i) => {
        const title = type === 'movie' ? item.title : item.name;
        const year = type === 'movie'
            ? item.release_date?.split('-')[0]
            : item.first_air_date?.split('-')[0];
        const rating = item.vote_average ? `⭐ ${item.vote_average.toFixed(1)}` : '';
        return `**${i + 1}.** ${title} ${year ? `(${year})` : ''} ${rating}`;
    }).join('\n');

    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`Search Results for "${query}"`)
        .setDescription(description)
        .setFooter({ text: `${results.length} results • Select from dropdown • ${BOT_FOOTER}` });

    const firstPoster = results[0]?.poster_path;
    if (firstPoster) {
        embed.setThumbnail(`https://image.tmdb.org/t/p/w200${firstPoster}`);
    }

    return embed;
}

export function createSeasonSelectEmbed(title: string, posterUrl: string | null, totalSeasons: number): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(title)
        .setDescription(`**${totalSeasons} seasons available**\nSelect a season from the dropdown below.`)
        .setFooter({ text: BOT_FOOTER });

    if (posterUrl) {
        embed.setThumbnail(posterUrl);
    }

    return embed;
}

export function createEpisodeSelectEmbed(
    title: string,
    seasonNumber: number,
    episodes: EpisodeInfo[],
    posterUrl: string | null
): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`${title} • Season ${seasonNumber}`)
        .setDescription(`**${episodes.length} episodes available**\nSelect an episode from the dropdown below.`)
        .setFooter({ text: BOT_FOOTER });

    if (posterUrl) {
        embed.setThumbnail(posterUrl);
    }

    return embed;
}

export function createLoadingEmbed(title: string, posterUrl: string | null): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`Searching: ${title}`)
        .setDescription('🔍 Searching **Torrentio**, **Comet**, **StremThru**, **PirateBay+**...')
        .setFooter({ text: BOT_FOOTER });

    if (posterUrl) {
        embed.setThumbnail(posterUrl);
    }

    return embed;
}

export function createNoTorrentsEmbed(title: string, posterUrl: string | null): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle('No Torrents Found')
        .setDescription(`No torrents available for **${title}**\n\nTry a different title or check back later.`)
        .setFooter({ text: BOT_FOOTER });

    if (posterUrl) {
        embed.setThumbnail(posterUrl);
    }

    return embed;
}

export function formatTorrentList(torrents: TorrentResult[], startIndex: number = 0): string {
    return torrents.map((t, i) => {
        const num = startIndex + i + 1;
        return `**#${num}** ${t.title}\n` +
            `├ 📊 \`${t.quality}\` | 👤 \`${t.seeders}\` | 💾 \`${t.size}\`\n` +
            `└ 🔗 ${t.source} • File #${t.fileIdx}`;
    }).join('\n\n');
}

export function createTorrentsEmbed(
    title: string,
    torrents: TorrentResult[],
    currentPage: number,
    totalPages: number,
    totalResults: number,
    posterUrl: string | null,
    requestedBy: string
): EmbedBuilder {
    const pageStart = currentPage * PAGINATION.ITEMS_PER_PAGE;
    const pageEnd = Math.min(pageStart + PAGINATION.ITEMS_PER_PAGE, torrents.length);
    const pageTorrents = torrents.slice(pageStart, pageEnd);

    const description = `Requested by <@${requestedBy}>\n\n${formatTorrentList(pageTorrents, pageStart)}`;

    const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setAuthor({ name: 'ViviTorr • Torrent Search' })
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: `Page ${currentPage + 1}/${totalPages} • ${totalResults} results • Use /search to find torrents` });

    if (posterUrl) {
        embed.setThumbnail(posterUrl);
    }

    return embed;
}

export function createErrorEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle('Error')
        .setDescription(message)
        .setFooter({ text: BOT_FOOTER });
}

export function createCreditsEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('ViviTorr')
        .setDescription('A simple bot that helps you search torrents for content quickly. Just type ``/search`` command to begin')
        .addFields(
            {
                name: '🫩 Creator & Developer',
                value: '<@1141729666160402565> (10/10 btw)',
                inline: true
            },
            {
                name: '🤯 Inspiration & Helper',
                value: '<@712521210302300161> (likes uni cat)',
                inline: true
            },
            {
                name: '📚 Built with',
                value: '• TypeScript\n• Discord.js\n• Node.js\n• Redis',
                inline: true
            },
            {
                name: '🔥 Data Sources',
                value: '• [TMDB](https://www.themoviedb.org/) - Movie & TV metadata\n• [Torrentio](https://torrentio.strem.fun/) - Torrent indexer\n• [Comet](https://comet.feels.legal/) - Torrent indexer\n• [StremThru](https://stremthru.13377001.xyz/) - Torrent indexer\n• [PirateBay+](https://thepiratebay-plus.strem.fun/) - Torrent indexer',
                inline: false
            },
            {
                name: '🔗 Trackers',
                value: '[ngosang/trackerslist](https://github.com/ngosang/trackerslist) - Best public trackers',
                inline: false
            },
            {
                name: '🌐 Website',
                value: '[vivitorr.vercel.app](https://vivitorr.vercel.app)',
                inline: true
            },
            {
                name: '📂 Source Code',
                value: '[GitHub Repository](https://github.com/rishabnotfound/ViviTorr)',
                inline: true
            },
            {
                name: '⚠️ Disclaimer',
                value: 'ViviTorr does not host, store, or distribute any torrents. We simply aggregate publicly available information from third-party indexers.',
                inline: false
            }
        )
        .setFooter({ text: BOT_FOOTER })
        .setTimestamp();
}

export function createHelpEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('ViviTorr Commands')
        .setDescription('Search torrents for movies and TV shows.\n\n*We do not host or store any content. ViviTorr only aggregates publicly available data from third-party sources.*')
        .addFields(
            {
                name: '/search',
                value: 'Search for movies or TV shows and get magnet links',
                inline: false
            },
            {
                name: '/credits',
                value: 'View bot info, credits, and data sources',
                inline: false
            },
            {
                name: '/help',
                value: 'Show this help message',
                inline: false
            }
        )
        .setFooter({ text: BOT_FOOTER });
}
