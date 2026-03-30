import type { UserSession, TorrentSession } from '../types/index.js';

class SessionManager {
    private userSessions = new Map<string, UserSession>();
    private torrentSessions = new Map<string, TorrentSession>();

    // User sessions for search flow
    setUserSession(userId: string, session: UserSession): void {
        this.userSessions.set(userId, session);
    }

    getUserSession(userId: string): UserSession | undefined {
        return this.userSessions.get(userId);
    }

    deleteUserSession(userId: string): void {
        this.userSessions.delete(userId);
    }

    // Torrent sessions for pagination
    setTorrentSession(userId: string, session: TorrentSession): void {
        this.torrentSessions.set(`torrents_${userId}`, session);
    }

    getTorrentSession(userId: string): TorrentSession | undefined {
        return this.torrentSessions.get(`torrents_${userId}`);
    }

    deleteTorrentSession(userId: string): void {
        this.torrentSessions.delete(`torrents_${userId}`);
    }

    // Cleanup old sessions (call periodically)
    cleanup(): void {
        // Simple cleanup - in production you'd want TTL-based expiration
        if (this.userSessions.size > 1000) {
            this.userSessions.clear();
        }
        if (this.torrentSessions.size > 1000) {
            this.torrentSessions.clear();
        }
    }
}

export const sessions = new SessionManager();
