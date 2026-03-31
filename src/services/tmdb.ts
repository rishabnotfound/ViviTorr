import { TMDB } from '../config/constants.js';
import { env } from '../config/env.js';
import { cache, CACHE_TTL, CACHE_KEYS } from './cache.js';
import type { TMDBSearchResult, TMDBDetails, ContentType, SeasonInfo, EpisodeInfo } from '../types/index.js';

interface TMDBSearchResponse {
    results: TMDBSearchResult[];
    total_results: number;
}

interface TMDBSeasonResponse {
    episodes: EpisodeInfo[];
}

// Retry wrapper for fetch with exponential backoff
async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'ViviTorr/1.0'
                }
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.log(`TMDB fetch attempt ${attempt}/${retries} failed: ${errorMsg}`);

            if (attempt === retries) {
                throw error;
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
    throw new Error('All retry attempts failed');
}

export async function searchContent(query: string, type: ContentType): Promise<TMDBSearchResult[]> {
    const cacheKey = `${CACHE_KEYS.TMDB_SEARCH}:${type}:${query.toLowerCase()}`;

    // Check cache
    const cached = await cache.get<TMDBSearchResult[]>(cacheKey);
    if (cached) {
        console.log(`Cache hit: ${cacheKey}`);
        return cached;
    }

    const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';

    const response = await fetchWithRetry(
        `${TMDB.BASE_URL}/${endpoint}?api_key=${env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&include_adult=false`
    );

    if (!response.ok) {
        throw new Error(`TMDB search failed: ${response.statusText}`);
    }

    const data = await response.json() as TMDBSearchResponse;

    const sorted = (data.results ?? [])
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
        .slice(0, 10);

    // Cache result
    await cache.set(cacheKey, sorted, CACHE_TTL.TMDB);

    return sorted;
}

export async function getDetails(tmdbId: string, type: ContentType): Promise<TMDBDetails> {
    const cacheKey = `${CACHE_KEYS.TMDB_DETAILS}:${type}:${tmdbId}`;

    // Check cache
    const cached = await cache.get<TMDBDetails>(cacheKey);
    if (cached) {
        console.log(`Cache hit: ${cacheKey}`);
        return cached;
    }

    const endpoint = type === 'movie' ? `movie/${tmdbId}` : `tv/${tmdbId}`;

    const response = await fetchWithRetry(
        `${TMDB.BASE_URL}/${endpoint}?api_key=${env.TMDB_API_KEY}&language=en-US&append_to_response=external_ids`
    );

    if (!response.ok) {
        throw new Error(`TMDB details fetch failed: ${response.statusText}`);
    }

    const data = await response.json() as TMDBDetails;

    // Cache result
    await cache.set(cacheKey, data, CACHE_TTL.TMDB);

    return data;
}

export async function getSeasonEpisodes(tmdbId: string, seasonNumber: number): Promise<EpisodeInfo[]> {
    const cacheKey = `${CACHE_KEYS.TMDB_SEASON}:${tmdbId}:${seasonNumber}`;

    // Check cache
    const cached = await cache.get<EpisodeInfo[]>(cacheKey);
    if (cached) {
        console.log(`Cache hit: ${cacheKey}`);
        return cached;
    }

    const url = `${TMDB.BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${env.TMDB_API_KEY}&language=en-US`;
    console.log(`Fetching season episodes: tv/${tmdbId}/season/${seasonNumber}`);

    const response = await fetchWithRetry(url);

    if (!response.ok) {
        throw new Error(`TMDB season details fetch failed: ${response.statusText}`);
    }

    const data = await response.json() as TMDBSeasonResponse;
    const episodes = data.episodes ?? [];

    console.log(`Got ${episodes.length} episodes`);

    // Cache result
    await cache.set(cacheKey, episodes, CACHE_TTL.TMDB);

    return episodes;
}

export function getPosterUrl(posterPath: string | null | undefined): string | null {
    if (!posterPath) return null;
    return `${TMDB.IMAGE_BASE}/${TMDB.POSTER_SIZE}${posterPath}`;
}

export function getSeasons(details: TMDBDetails): SeasonInfo[] {
    return details.seasons?.filter(s => s.season_number > 0) ?? [];
}
