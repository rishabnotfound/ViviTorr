import { TRACKERS } from '../config/constants.js';

interface TrackerCache {
    data: string | null;
    lastFetch: number;
}

const cache: TrackerCache = {
    data: null,
    lastFetch: 0
};

async function fetchFromUrl(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRACKERS.FETCH_TIMEOUT);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        const text = await response.text();
        return '&tr=' + text.split('\n').filter(line => line.includes('://')).join('&tr=');
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function getTrackers(): Promise<string> {
    const now = Date.now();

    if (cache.data && (now - cache.lastFetch) < TRACKERS.CACHE_TTL) {
        return cache.data;
    }

    try {
        cache.data = await fetchFromUrl(TRACKERS.PRIMARY_URL);
        cache.lastFetch = now;
        return cache.data;
    } catch (error) {
        console.error('Primary trackers fetch failed:', error);
    }

    try {
        cache.data = await fetchFromUrl(TRACKERS.BACKUP_URL);
        cache.lastFetch = now;
        return cache.data;
    } catch (error) {
        console.error('Backup trackers fetch failed:', error);
    }

    throw new Error('Failed to fetch trackers from all sources');
}
