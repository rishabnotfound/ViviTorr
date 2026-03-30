export const COLORS = {
    PRIMARY: 0x5DADE2,      // Light blue theme
    ERROR: 0xE74C3C,
    SUCCESS: 0x2ECC71,
    WARNING: 0xF39C12
} as const;

export const TMDB = {
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE: 'https://image.tmdb.org/t/p',
    POSTER_SIZE: 'w300'
} as const;

export const TRACKERS = {
    PRIMARY_URL: 'https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_best.txt',
    BACKUP_URL: 'https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_best.txt',
    CACHE_TTL: 20 * 60 * 1000,  // 20 minutes
    FETCH_TIMEOUT: 2500
} as const;

export const PAGINATION = {
    ITEMS_PER_PAGE: 10,
    MAX_BUTTONS: 5
} as const;

export const TIMEOUTS = {
    ADDON_DEFAULT: 5000,
    TRACKER_FETCH: 2500
} as const;
