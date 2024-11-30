# Radio Station Application

A modern radio station application built with Cloudflare Workers, Pages, and D1 database.

## Features

- Song management and playback
- User authentication and authorization
- Playlist creation and management
- AI-powered song search
- Cloud storage for audio files

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure Cloudflare:
```bash
# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create radio-station-db

# Apply database migrations
wrangler d1 execute radio-station-db --file=./schema.sql
```

3. Update wrangler.toml:
- Replace `database_id` with your actual D1 database ID
- Configure your R2 bucket settings

## Development

Run locally:
```bash
npm install
```

## Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Project Structure

- `/src` - Source code
  - `/routes` - API route handlers
  - `/models` - Database models
  - `/services` - Business logic
  - `/utils` - Utility functions
- `/frontend` - Frontend application

## Environment Variables

Required environment variables:
- `DB` - D1 database binding
- `AI` - Workers AI binding
- `MUSIC_STORAGE` - R2 bucket binding 