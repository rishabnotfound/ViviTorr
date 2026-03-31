import Redis from 'ioredis';

// Cache TTLs in seconds
export const CACHE_TTL = {
    TMDB: 60 * 60,           // 1 hour
    TORRENTS: 2 * 60 * 60,   // 2 hours
    STATIC: 3 * 60 * 60      // 3 hours (help, credits)
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
    TMDB_SEARCH: 'tmdb:search',
    TMDB_DETAILS: 'tmdb:details',
    TMDB_SEASON: 'tmdb:season',
    TORRENTS: 'torrents'
} as const;

class CacheService {
    private redis: Redis | null = null;
    private connected = false;

    async connect(): Promise<void> {
        if (this.redis) return;

        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        try {
            this.redis = new Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                lazyConnect: true
            });

            await this.redis.connect();
            this.connected = true;
            console.log('Redis connected');
        } catch (error) {
            console.log('Redis connection failed, running without cache:', error instanceof Error ? error.message : 'Unknown error');
            this.redis = null;
            this.connected = false;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.redis || !this.connected) return null;

        try {
            const data = await this.redis.get(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            console.log('Cache get error:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    async set(key: string, value: unknown, ttl: number): Promise<void> {
        if (!this.redis || !this.connected) return;

        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
        } catch (error) {
            console.log('Cache set error:', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    async delete(key: string): Promise<void> {
        if (!this.redis || !this.connected) return;

        try {
            await this.redis.del(key);
        } catch (error) {
            console.log('Cache delete error:', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    isConnected(): boolean {
        return this.connected;
    }
}

export const cache = new CacheService();