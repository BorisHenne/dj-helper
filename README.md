# 🎧 DJ Helper

Application web de rotation DJ pour les blindtests quotidiens. Permet de désigner équitablement le DJ du jour via une roue pondérée.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)

## Fonctionnalités

- **Roue de sélection** - Désignation aléatoire pondérée du DJ
- **Gestion des DJs** - Ajout, modification, suppression des participants
- **Historique musical** - Suivi des musiques passées avec liens YouTube
- **Probabilités intelligentes** - Pondération basée sur :
  - Ancienneté du dernier passage
  - Nombre total de passages
- **Sessions quotidiennes** - Planification et suivi des blindtests
- **Fenêtre d'enregistrement** - Mode actif/passif (10h-11h)
- **Export XLSX** - Export de l'historique complet
- **PWA** - Application installable sur mobile
- **i18n** - Français et Anglais

## Stack Technique

### Frontend
| Technologie | Usage |
|-------------|-------|
| **Next.js 14** | Framework React avec App Router |
| **React 18** | Bibliothèque UI |
| **TypeScript** | Typage statique |
| **Tailwind CSS** | Styling utilitaire |
| **Framer Motion** | Animations fluides |
| **Lucide React** | Icônes |
| **next-intl** | Internationalisation |
| **next-pwa** | Progressive Web App |

### Backend
| Technologie | Usage |
|-------------|-------|
| **Next.js API Routes** | API REST |
| **Drizzle ORM** | ORM TypeScript |
| **better-sqlite3** | Base de données SQLite |
| **ytsr** | Recherche YouTube |

### Infrastructure
| Technologie | Usage |
|-------------|-------|
| **Docker** | Conteneurisation |
| **Docker Compose** | Orchestration |
| **GitHub Actions** | CI/CD |
| **Cloudflare Tunnel** | Déploiement sécurisé |

## Structure du Projet

```
dj-helper/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── djs/          # CRUD DJs
│   │   │   ├── history/      # Historique musical
│   │   │   ├── sessions/     # Sessions quotidiennes
│   │   │   ├── settings/     # Paramètres
│   │   │   ├── youtube/      # Intégration YouTube
│   │   │   └── registration/ # Fenêtre d'enregistrement
│   │   ├── user/             # Pages de gestion
│   │   └── page.tsx          # Page principale (roue)
│   ├── components/            # Composants React
│   │   ├── SpinningWheel.tsx # Roue de sélection
│   │   ├── Header.tsx        # Navigation
│   │   ├── DJCard.tsx        # Carte DJ
│   │   └── ...
│   ├── db/                    # Configuration Drizzle
│   │   ├── schema.ts         # Schéma de la BDD
│   │   └── index.ts          # Client DB
│   ├── lib/                   # Utilitaires
│   │   ├── probability.ts    # Calcul des probabilités
│   │   ├── dates.ts          # Gestion des dates
│   │   └── security/         # Rate limiting, validation
│   └── types/                 # Types TypeScript
├── database/                  # Scripts et données
│   ├── data/                 # Base SQLite (volume Docker)
│   ├── seed.ts               # Seed initial
│   ├── seed-data/            # Données par défaut
│   └── migrate-dates.ts      # Migration des dates
├── messages/                  # Traductions i18n
│   ├── fr.json               # Français
│   └── en.json               # Anglais
├── public/                    # Assets statiques
│   ├── icons/                # Icônes PWA
│   └── manifest.json         # Manifest PWA
├── scripts/                   # Scripts utilitaires
│   ├── docker-build.sh       # Build Docker optimisé
│   └── generate-icons.js     # Génération des icônes
├── docker-compose.yml         # Configuration Docker
├── Dockerfile                 # Image Docker multi-stage
├── drizzle.config.ts         # Configuration Drizzle
└── tailwind.config.ts        # Configuration Tailwind
```

## Installation

### Prérequis
- Node.js 20+
- Docker & Docker Compose (pour le déploiement)

### Développement local

```bash
# Cloner le repo
git clone https://github.com/BorisHenne/dj-helper.git
cd dj-helper

# Installer les dépendances
npm install --legacy-peer-deps

# Initialiser la base de données
npm run db:push
npm run db:seed

# Lancer en développement
npm run dev
```

### Déploiement Docker

```bash
# Build et démarrage
docker compose up -d --build

# Ou avec le script optimisé (évite les images orphelines)
./scripts/docker-build.sh
docker compose up -d
```

L'application sera disponible sur `http://localhost:9000`

## Configuration

### Variables d'environnement
| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement | `production` |
| `PORT` | Port d'écoute | `3000` |

### Paramètres de l'application

Dans l'interface de gestion (`/user`) :
- **Poids ancienneté** : Favorise les DJs n'ayant pas joué depuis longtemps
- **Poids passages** : Favorise les DJs avec peu de passages

## API

### DJs
- `GET /api/djs` - Liste des DJs
- `POST /api/djs` - Créer un DJ
- `PATCH /api/djs/:id` - Modifier un DJ
- `DELETE /api/djs/:id` - Supprimer un DJ
- `POST /api/djs/:id/play` - Enregistrer un passage

### Historique
- `GET /api/history` - Liste de l'historique
- `POST /api/history` - Ajouter une entrée
- `GET /api/history/latest` - Dernière musique jouée

### Sessions
- `GET /api/sessions/today` - Session du jour
- `GET /api/sessions/next` - Prochaine session
- `POST /api/sessions` - Créer une session
- `POST /api/sessions/:id/complete` - Terminer une session
- `POST /api/sessions/:id/skip` - Annuler une session

### YouTube
- `GET /api/youtube?url=...` - Infos vidéo
- `GET /api/youtube/search?artist=...&title=...` - Recherche vidéo

## Licence

MIT

---

Développé avec ❤️ par [Boris Henne](https://github.com/BorisHenne)
