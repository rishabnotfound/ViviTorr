import { TIMEOUTS } from '../config/constants.js';
import { getTrackers } from './trackers.js';
import { addons } from './addons.js';
import type { AddonConfig, TorrentResult, StreamData } from '../types/index.js';

interface StreamResponse {
    streams?: StreamData[];
}

async function fetchFromAddon(
    addon: AddonConfig,
    imdbId: string,
    trackers: string,
    season?: string,
    episode?: string
): Promise<TorrentResult[]> {
    const baseUrl = addon.url.replace('/manifest.json', '').replace('stremio://', 'https://');
    const timeout = addon.timeout ?? TIMEOUTS.ADDON_DEFAULT;

    const streamPath = season
        ? `/stream/series/${imdbId}:${season}:${episode}.json`
        : `/stream/movie/${imdbId}.json`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(`${baseUrl}${streamPath}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json() as StreamResponse;

        if (!data.streams?.length) {
            return [];
        }

        return addon.filterStreams(data.streams, trackers);
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log(`[${addon.name}] Request timed out`);
        } else {
            console.log(`[${addon.name}] Error:`, error);
        }
        return [];
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function searchTorrents(
    imdbId: string,
    season?: string,
    episode?: string
): Promise<TorrentResult[]> {
    const trackers = await getTrackers();

    const results = await Promise.allSettled(
        addons.map(addon => fetchFromAddon(addon, imdbId, trackers, season, episode))
    );

    const torrents: TorrentResult[] = [];

    for (const result of results) {
        if (result.status === 'fulfilled') {
            torrents.push(...result.value);
        }
    }

    // Sort by seeders descending
    return torrents.sort((a, b) => b.seeders - a.seeders);
}
