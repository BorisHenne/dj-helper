# 🎧 DJ Rotation App

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

**A stunning animated wheel selector for your daily DJ blind test events**

*Fair rotation • Smart probabilities • Beautiful animations*

[Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [API](#-api-reference)

</div>

---

## ✨ Features

### 🎡 Animated Spinning Wheel
An eye-catching, disco-themed wheel with smooth Framer Motion animations. Each DJ gets their own color segment, and when a winner is selected — confetti explosion!

### 🧠 Smart Probability System
No more unfair selections. The algorithm considers:
- **Recency** (60% weight) — DJs who haven't played recently get boosted
- **Total Plays** (40% weight) — DJs with fewer plays get higher chances
- Weights are fully adjustable via admin sliders

### 👥 DJ Management
Full CRUD operations with:
- Custom avatars (30+ emojis: 🎸🎺🎹🎷🦊🐱...)
- Personalized colors
- Play statistics tracking
- Active/inactive toggle

### 📊 Excel Import/Export
Bulk import your DJ roster from Excel files. Download a template, fill it in, and import in seconds.

### 🎵 Music History
Track every song played during blind tests:
- Auto-fill from YouTube URLs
- Search and filter history
- YouTube thumbnails & inline player

### 🌍 Multilingual
Full support for **English** and **French** with instant language switching.

### 🎨 Gorgeous UI
- Dark neon disco theme
- Glass-morphism effects
- Responsive on all devices
- Glowing text animations

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/BorisHenne/dj-helper.git
cd dj-helper

# Start with Docker Compose
docker compose up -d --build

# Access at http://localhost:9000
```

### Local Development

```bash
# Install dependencies
npm install

# Initialize database
npx prisma db push

# Seed sample data (16 DJs + history)
npm run db:seed

# Start dev server
npm run dev

# Access at http://localhost:3000
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **UI** | React 18 + TailwindCSS |
| **Animations** | Framer Motion |
| **Database** | SQLite + Prisma ORM |
| **i18n** | next-intl |
| **Icons** | Lucide React |
| **YouTube** | ytsr |
| **Deployment** | Docker + GitHub Actions |

---

## 📁 Project Structure

```
dj-helper/
├── src/
│   ├── app/
│   │   ├── api/            # 13 API routes
│   │   ├── admin/          # Admin panel & history
│   │   └── page.tsx        # Home (spinning wheel)
│   ├── components/         # React components
│   │   ├── SpinningWheel.tsx
│   │   ├── YouTubePlayer.tsx
│   │   ├── LatestMusic.tsx
│   │   └── ...
│   ├── lib/                # Utilities
│   └── types/              # TypeScript interfaces
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.mjs            # Sample data
├── messages/               # EN/FR translations
├── Dockerfile
└── docker-compose.yml
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/djs` | List all DJs |
| `POST` | `/api/djs` | Create a DJ |
| `PATCH` | `/api/djs/[id]` | Update a DJ |
| `DELETE` | `/api/djs/[id]` | Delete a DJ |
| `POST` | `/api/djs/[id]/play` | Record a play |
| `GET` | `/api/probability` | Get calculated probabilities |
| `POST` | `/api/probability` | Select DJ by probability |
| `GET/PATCH` | `/api/settings` | Manage settings |
| `POST` | `/api/import` | Import from Excel |
| `GET` | `/api/template` | Download Excel template |
| `GET` | `/api/history` | Get music history |
| `GET` | `/api/youtube/search` | Search YouTube |

---

## 🗃 Database Schema

```prisma
model DJ {
  id           Int       @id @default(autoincrement())
  name         String    @unique
  avatar       String    @default("🎵")
  color        String    @default("#FF69B4")
  totalPlays   Int       @default(0)
  lastPlayedAt DateTime?
  isActive     Boolean   @default(true)
  plays        Play[]
}

model DJHistory {
  id         Int      @id @default(autoincrement())
  djName     String
  title      String
  artist     String
  youtubeUrl String?
  videoId    String?
  playedAt   DateTime @default(now())
}

model Settings {
  id               Int    @id @default(1)
  weightLastPlayed Float  @default(0.6)
  weightTotalPlays Float  @default(0.4)
}
```

---

## 🐳 Docker Configuration

```yaml
services:
  dj-rotation:
    build: .
    container_name: dj-rotation
    ports:
      - "9000:3000"
    volumes:
      - dj-rotation-data:/app/prisma/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/settings"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 📜 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:push    # Sync Prisma schema
npm run db:studio  # Open Prisma Studio GUI
npm run db:seed    # Seed database with sample data
```

---

## 📊 Probability Calculation

The probability for each DJ is calculated using two factors:

### 1. Recency Score (default 60% weight)
The longer a DJ hasn't played, the higher their probability increases.

### 2. Play Count Score (default 40% weight)
The fewer total plays a DJ has, the higher their probability.

Both weights are adjustable through the admin panel sliders.

---

## 🎯 How It Works

1. **Spin the Wheel** — Click the wheel on the home page
2. **Watch the Magic** — The wheel spins with smooth animations
3. **Winner Selected** — Confetti celebrates the chosen DJ
4. **Confirm & Record** — Log the play and optionally add the song
5. **Fair Rotation** — Probabilities automatically adjust for next spin

---

## 🔧 CI/CD Configuration

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | SSH private key for NAS access |
| `SSH_USER` | SSH username |
| `SSH_HOSTNAME` | Cloudflare tunnel hostname |
| `DEPLOY_PATH` | Deployment path on NAS |

The app auto-deploys to your NAS via Cloudflare Tunnel on push to main.

---

## 📥 Excel Import Format

| Name | Total Plays | Last Play |
|------|-------------|-----------|
| Alice | 5 | 2024-01-15 |
| Bob | 3 | 2024-02-20 |
| Charlie | 0 | |

Download the template directly from the admin interface.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

[MIT](LICENSE)

---

<div align="center">

**Made with 💜 for blind test enthusiasts**

*Spin fair. Play loud. Have fun.*

</div>
