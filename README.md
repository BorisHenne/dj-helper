# 🎧 DJ Rotation App

Application fun pour sélectionner le DJ du jour lors de vos blindtests quotidiens !

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

## ✨ Fonctionnalités

- 🎰 **Roue de sélection animée** - Tournez la roue pour désigner le DJ du jour
- 📊 **Probabilités intelligentes** - Basées sur l'ancienneté et le nombre de passages
- 👥 **Gestion des participants** - Ajoutez, modifiez, activez/désactivez les DJs
- 📥 **Import Excel** - Importez vos participants depuis un fichier Excel
- 🎨 **Interface fun et moderne** - Design disco avec animations
- 🐳 **Docker Ready** - Déployez facilement sur votre NAS

## 🚀 Installation

### Option 1 : Docker Compose (recommandé)

```bash
docker compose up -d --build
```

L'application sera accessible sur `http://localhost:3000`

### Option 2 : Développement local

```bash
# Installer les dépendances
npm install

# Initialiser la base de données
npx prisma db push

# Lancer en mode développement
npm run dev
```

## 📁 Structure du projet

```
dj-rotation-app/
├── src/
│   ├── app/              # Pages Next.js (App Router)
│   │   ├── api/          # Routes API
│   │   ├── admin/        # Page d'administration
│   │   └── page.tsx      # Page principale
│   ├── components/       # Composants React
│   ├── lib/              # Utilitaires
│   └── types/            # Types TypeScript
├── prisma/
│   └── schema.prisma     # Schéma de base de données
├── docker-compose.yml    # Configuration Docker
└── Dockerfile
```

## 📊 Calcul des probabilités

La probabilité de chaque DJ est calculée selon :

1. **Ancienneté** (poids par défaut : 60%)
   - Plus un DJ n'a pas joué depuis longtemps, plus sa probabilité augmente

2. **Nombre de passages** (poids par défaut : 40%)
   - Moins un DJ a joué au total, plus sa probabilité augmente

Les poids sont ajustables dans le panneau d'administration.

## 📥 Import Excel

Format attendu pour l'import :

| Nom | Nombre de passages | Dernier passage |
|-----|-------------------|-----------------|
| Alice | 5 | 2024-01-15 |
| Bob | 3 | 2024-02-20 |
| Charlie | 0 | |

Téléchargez le template depuis l'interface admin.

## 🔧 Configuration CI/CD

### Secrets GitHub requis

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | Clé SSH privée pour accès au NAS |
| `SSH_USER` | Utilisateur SSH |
| `SSH_HOSTNAME` | Hostname du tunnel Cloudflare |
| `DEPLOY_PATH` | Chemin de déploiement sur le NAS |

## 📝 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/djs` | Liste tous les DJs |
| POST | `/api/djs` | Crée un nouveau DJ |
| GET | `/api/djs/[id]` | Récupère un DJ |
| PATCH | `/api/djs/[id]` | Met à jour un DJ |
| DELETE | `/api/djs/[id]` | Supprime un DJ |
| POST | `/api/djs/[id]/play` | Enregistre un passage |
| GET | `/api/probability` | Calcule les probabilités |
| POST | `/api/probability` | Sélectionne un DJ |
| POST | `/api/import` | Import Excel |
| GET | `/api/template` | Télécharge le template Excel |
| GET/PATCH | `/api/settings` | Gère les paramètres |

## 🎉 Utilisation

1. **Ajouter des participants** via l'admin (`/admin`)
2. **Tourner la roue** sur la page principale
3. **Confirmer** le DJ sélectionné pour enregistrer le passage
4. Les probabilités sont automatiquement recalculées !

---

Made with ❤️ pour les blindtests quotidiens
