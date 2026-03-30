import 'dotenv/config';

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function optionalEnv(key: string): string | undefined {
    return process.env[key];
}

export const env = {
    DISCORD_TOKEN: requireEnv('DISCORD_TOKEN'),
    CLIENT_ID: requireEnv('CLIENT_ID'),
    GUILD_ID: optionalEnv('GUILD_ID'),
    TMDB_API_KEY: requireEnv('TMDB_API_KEY')
} as const;
