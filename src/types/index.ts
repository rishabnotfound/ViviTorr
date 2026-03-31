export interface TorrentResult {
    title: string;
    quality: string;
    seeders: number;
    size: string;
    magnetURI: string;
    fileIdx: string | number;
    source: string;
}

export interface StreamData {
    title?: string;
    description?: string;
    name?: string;
    infoHash?: string;
    fileIdx?: number | null;
    sources?: string[];
}

export interface AddonConfig {
    name: string;
    url: string;
    timeout?: number;
    filterStreams: (streams: StreamData[], trackers: string) => TorrentResult[];
}

export interface TMDBSearchResult {
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    poster_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
    popularity?: number;
}

export interface SeasonInfo {
    id: number;
    season_number: number;
    episode_count: number;
    name: string;
    air_date?: string;
    poster_path?: string | null;
}

export interface EpisodeInfo {
    episode_number: number;
    name: string;
    overview?: string;
    air_date?: string;
    still_path?: string | null;
}

export interface TMDBDetails {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string | null;
    release_date?: string;
    number_of_seasons?: number;
    seasons?: SeasonInfo[];
    external_ids?: {
        imdb_id?: string;
    };
}

export interface UserSession {
    tmdbId: string;
    imdbId: string;
    title: string;
    posterUrl: string | null;
    type: 'movie' | 'tv';
    seasons?: SeasonInfo[];
    selectedSeason?: number;
    episodes?: EpisodeInfo[];
}

export interface TorrentSession {
    torrents: TorrentResult[];
    pages: TorrentResult[][];
    currentPage: number;
    title: string;
    posterUrl: string | null;
    requestedBy: string;
}

export type ContentType = 'movie' | 'tv';
