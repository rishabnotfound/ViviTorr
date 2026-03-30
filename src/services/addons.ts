import type { AddonConfig, StreamData, TorrentResult } from '../types/index.js';

function parseFileIdx(stream: StreamData): string | number {
    if (stream.fileIdx === null || stream.fileIdx === undefined) {
        return 'N/A';
    }
    if (Number(stream.fileIdx) > -1) {
        return Number(stream.fileIdx) + 1;
    }
    return 'N/A';
}

function extractSeeders(text: string): number {
    const match = text.match(/👤\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

function extractSize(text: string): string {
    const match = text.match(/💾\s?(\d+(\.\d+)?\s?(MB|GB))/i);
    return match ? match[1] : 'N/A';
}

function buildMagnetWithTrackers(infoHash: string, trackers: string, sources?: string[]): string {
    let additionalTrackers = '';

    if (sources?.length) {
        sources.forEach(source => {
            if (source.startsWith('tracker:')) {
                additionalTrackers += `&tr=${source.slice(8)}`;
            }
        });
    }

    return `magnet:?xt=urn:btih:${infoHash}${trackers}${additionalTrackers}`;
}

export const addons: AddonConfig[] = [
    {
        name: 'Torrentio',
        url: 'https://torrentio.strem.fun',
        filterStreams: (streams: StreamData[], trackers: string): TorrentResult[] => {
            return streams
                .filter(stream => stream.title?.includes('👤') && stream.title?.includes('💾'))
                .map(stream => {
                    const seeders = extractSeeders(stream.title!);
                    if (seeders < 1) return null;

                    let quality = stream.name?.split('\n')[1] ?? 'N/A';
                    quality = quality.replace(' | ', ' ');

                    return {
                        title: stream.title!.split('\n')[0] ?? stream.title!,
                        quality,
                        seeders,
                        size: extractSize(stream.title!),
                        magnetURI: buildMagnetWithTrackers(stream.infoHash!, trackers, stream.sources),
                        fileIdx: parseFileIdx(stream),
                        source: 'Torrentio'
                    };
                })
                .filter((result): result is TorrentResult => result !== null);
        }
    },
    {
        name: 'Comet',
        url: 'https://comet.feels.legal',
        filterStreams: (streams: StreamData[], trackers: string): TorrentResult[] => {
            return streams
                .filter(stream => stream.description?.includes('💾'))
                .map(stream => {
                    const quality = stream.name?.split(' ').pop() ?? 'N/A';

                    return {
                        title: stream.description!.split('\n')[0].replace('📄 ', ''),
                        quality,
                        seeders: extractSeeders(stream.description!),
                        size: extractSize(stream.description!),
                        magnetURI: buildMagnetWithTrackers(stream.infoHash!, trackers, stream.sources),
                        fileIdx: parseFileIdx(stream),
                        source: 'Comet'
                    };
                });
        }
    },
    {
        name: 'StremThru',
        url: 'https://stremthru.13377001.xyz/stremio/torz/eyJpbmRleGVycyI6bnVsbCwic3RvcmVzIjpbeyJjIjoicDJwIiwidCI6IiJ9XX0=',
        filterStreams: (streams: StreamData[], trackers: string): TorrentResult[] => {
            return streams
                .filter(stream => stream.description && stream.name?.includes('[P2P]'))
                .map(stream => {
                    let quality = stream.name?.split('\n').pop() ?? 'N/A';
                    quality = quality.replace('Torz', 'N/A');

                    return {
                        title: stream.description!.split('\n')[0].replace('📄 ', ''),
                        quality,
                        seeders: extractSeeders(stream.description!),
                        size: extractSize(stream.description!),
                        magnetURI: buildMagnetWithTrackers(stream.infoHash!, trackers, stream.sources),
                        fileIdx: parseFileIdx(stream),
                        source: 'StremThru'
                    };
                });
        }
    },
    {
        name: 'PirateBay+',
        url: 'https://thepiratebay-plus.strem.fun',
        filterStreams: (streams: StreamData[], trackers: string): TorrentResult[] => {
            return streams
                .filter(stream => stream.title?.includes('👤') && stream.title?.includes('💾'))
                .map(stream => {
                    const seeders = extractSeeders(stream.title!);
                    if (seeders < 1) return null;

                    const qualityMatch = stream.title!.match(/(?<=\n📺 )([^\\\n]+)/);
                    const quality = qualityMatch ? qualityMatch[1] : 'N/A';

                    const titleLine = stream.title!.split('\n')[1];
                    const title = (titleLine?.endsWith('.mp4') || titleLine?.endsWith('.mkv'))
                        ? titleLine
                        : stream.title!.split('\n')[0];

                    return {
                        title,
                        quality,
                        seeders,
                        size: extractSize(stream.title!),
                        magnetURI: buildMagnetWithTrackers(stream.infoHash!, trackers, stream.sources),
                        fileIdx: parseFileIdx(stream),
                        source: 'PirateBay+'
                    };
                })
                .filter((result): result is TorrentResult => result !== null);
        }
    }
];
