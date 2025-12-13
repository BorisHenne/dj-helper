# DJ Rotation

Web application for DJ rotation in daily blindtest sessions. Fairly selects the DJ of the day using a weighted wheel based on participation history.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-green)
![SQLite](https://img.shields.io/badge/SQLite-Database-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-cyan)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## Features

- **Weighted Wheel**: Fair random selection based on number of sessions and time since last participation
- **Session Management**: Track daily sessions with status (pending, completed, skipped)
- **Music History**: Complete history with YouTube integration (auto-fetch metadata, embedded player)
- **Excel Export**: Export history to XLSX format
- **PWA**: Installable Progressive Web App with offline support
- **i18n**: French and English interface
- **Time-based Registration**: Registration window between 10am-11am on business days

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **next-intl** - Internationalization (FR/EN)
- **next-pwa** - PWA support
- **Lucide React** - Icon library
- **React Lite YouTube Embed** - Optimized YouTube player

### Backend
- **Next.js API Routes** - RESTful endpoints
- **Drizzle ORM** - Type-safe database queries
- **better-sqlite3** - SQLite database driver
- **YouTube Data API** - Video metadata fetching

### Infrastructure
- **Docker** - Multi-stage build for production
- **GitHub Actions** - CI/CD pipeline
- **Cloudflare Tunnel** - Secure deployment to self-hosted server

## Installation

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Development

```bash
# Clone the repository
git clone https://github.com/BorisHenne/dj-helper.git
cd dj-helper

# Install dependencies
pnpm install

# Initialize the database
pnpm db:generate
pnpm db:push

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

### Production with Docker

```bash
# Build and run
docker-compose up -d --build

# View logs
docker logs -f dj-rotation
```

## Environment Variables

Create a `.env` file at the project root:

```env
# YouTube API (optional - for auto-fetching video metadata)
YOUTUBE_API_KEY=your_api_key

# Timezone
TZ=Europe/Paris
```

## Project Structure

```
├── database/           # Drizzle schema and migrations
│   └── schema.ts       # Database schema definition
├── messages/           # Translation files
│   ├── en.json         # English translations
│   └── fr.json         # French translations
├── public/             # Static assets and PWA icons
├── scripts/            # Utility scripts
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── api/        # API routes
│   │   ├── history/    # Music history page
│   │   └── user/       # DJ management page
│   ├── components/     # React components
│   │   ├── TodayDJ.tsx # Main DJ selection component
│   │   ├── Wheel.tsx   # Animated wheel component
│   │   └── ...
│   ├── db/             # Database connection
│   ├── lib/            # Utility functions
│   └── types/          # TypeScript type definitions
├── docker-compose.yml
├── Dockerfile
└── drizzle.config.ts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/djs` | List all DJs |
| POST | `/api/djs` | Create a new DJ |
| PUT | `/api/djs/[id]` | Update a DJ |
| DELETE | `/api/djs/[id]` | Delete a DJ |
| GET | `/api/probability` | Get weighted probabilities |
| GET | `/api/history` | Get music history |
| POST | `/api/history` | Add music entry |
| GET | `/api/sessions/today` | Get today's session |
| POST | `/api/sessions` | Create a session |
| GET | `/api/registration/status` | Check registration window |

## Configuration

### Probability Weights

The wheel uses two configurable weights to calculate probabilities:

- **Seniority Weight**: Favors DJs who haven't played recently
- **Play Count Weight**: Favors DJs with fewer total sessions

Adjust these in the Management page to fine-tune the selection fairness.

### Registration Window

Registration is only allowed between 10:00 AM and 11:00 AM on business days (Monday-Friday). This ensures sessions are planned at a consistent time each day.

## License

MIT
