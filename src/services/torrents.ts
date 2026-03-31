import { TIMEOUTS } from '../config/constants.js';
import { getTrackers } from './trackers.js';
import { addons } from './addons.js';
import { cache, CACHE_TTL, CACHE_KEYS } from './cache.js';
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
    const cacheKey = season
        ? `${CACHE_KEYS.TORRENTS}:${imdbId}:${season}:${episode}`
        : `${CACHE_KEYS.TORRENTS}:${imdbId}`;

    // Check cache
    const cached = await cache.get<TorrentResult[]>(cacheKey);
    if (cached) {
        console.log(`Cache hit: ${cacheKey}`);
        return cached;
    }

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
    const sorted = torrents.sort((a, b) => b.seeders - a.seeders);

    // Cache result (only if we got results)
    if (sorted.length > 0) {
        await cache.set(cacheKey, sorted, CACHE_TTL.TORRENTS);
    }

    return sorted;
}
