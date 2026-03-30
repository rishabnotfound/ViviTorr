import { TMDB } from '../config/constants.js';
import { env } from '../config/env.js';
import type { TMDBSearchResult, TMDBDetails, ContentType, SeasonInfo, EpisodeInfo } from '../types/index.js';

interface TMDBSearchResponse {
    results: TMDBSearchResult[];
    total_results: number;
}

interface TMDBSeasonResponse {
    episodes: EpisodeInfo[];
}

export async function searchContent(query: string, type: ContentType): Promise<TMDBSearchResult[]> {
    const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';

    const response = await fetch(
        `${TMDB.BASE_URL}/${endpoint}?api_key=${env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&include_adult=false`
    );

    if (!response.ok) {
        throw new Error(`TMDB search failed: ${response.statusText}`);
    }

    const data = await response.json() as TMDBSearchResponse;

    // Sort by popularity (higher = more popular/relevant)
    const sorted = (data.results ?? [])
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
        .slice(0, 10);

    return sorted;
}

export async function getDetails(tmdbId: string, type: ContentType): Promise<TMDBDetails> {
    const endpoint = type === 'movie' ? `movie/${tmdbId}` : `tv/${tmdbId}`;

    const response = await fetch(
        `${TMDB.BASE_URL}/${endpoint}?api_key=${env.TMDB_API_KEY}&language=en-US&append_to_response=external_ids`
    );

    if (!response.ok) {
        throw new Error(`TMDB details fetch failed: ${response.statusText}`);
    }

    return response.json() as Promise<TMDBDetails>;
}

export async function getSeasonEpisodes(tmdbId: string, seasonNumber: number): Promise<EpisodeInfo[]> {
    const response = await fetch(
        `${TMDB.BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${env.TMDB_API_KEY}&language=en-US`
    );

    if (!response.ok) {
        throw new Error(`TMDB season details fetch failed: ${response.statusText}`);
    }

    const data = await response.json() as TMDBSeasonResponse;
    return data.episodes ?? [];
}

export function getPosterUrl(posterPath: string | null | undefined): string | null {
    if (!posterPath) return null;
    return `${TMDB.IMAGE_BASE}/${TMDB.POSTER_SIZE}${posterPath}`;
}

export function getSeasons(details: TMDBDetails): SeasonInfo[] {
    return details.seasons?.filter(s => s.season_number > 0) ?? [];
}
