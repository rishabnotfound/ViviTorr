<p align="center">
      <img
        src="./public/logo.png"
        width="190"
        height="250"
      />
    </p>

# <p align="center">ViviTorr</p>


<p align="center">
  A Discord bot for searching torrents. Get magnet links with size, seeders, and quality info.
  <br />
<a href="https://discord.com/oauth2/authorize?client_id=1488227820097507588&permissions=4503876652886080&integration_type=0&scope=bot+applications.commands">👉 Invite Bot 👈</a>
</p>

## Preview

<img width="1038" height="772" alt="Screenshot 2026-03-31 at 2 08 32 AM" src="https://github.com/user-attachments/assets/db745aa4-4d39-4d59-b542-b56e6769ddc1" />

## Features

- Search movies and TV shows via TMDB
- Fetch torrents from Torrentio, Comet, StremThru, PirateBay+
- Episode selection with titles
- Sorted by seeders, paginated results

## Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/rishabnotfound/ViviTorr.git
   cd ViviTorr
   npm install
   ```

2. **Configure**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Discord bot token and client ID.

3. **Deploy & Run**
   ```bash
   npm run deploy   # Register slash commands
   npm run start    # Start the bot
   ```

## Commands

| Command | Description |
|---------|-------------|
| `/search` | Search for movies or TV shows |
| `/credits` | View bot info and credits |
| `/help` | Show all commands |

## Workflow

```
/search → Select Movie/TV → Enter query → Pick title
                                            ↓
                         [TV] → Select Season → Select Episode
                                            ↓
                              Torrent results (public)
                                            ↓
                              Click 🧲 → Copy magnet (private)
```

## Tech Stack

- TypeScript / Discord.js / Node.js
- TMDB API for metadata
- Stremio addons for torrents

## License

[MIT](LICENSE)
