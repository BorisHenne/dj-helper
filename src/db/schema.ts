import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Helper to convert Date to ISO string for storage
export const toISOString = (date: Date): string => date.toISOString();
export const toDateOrNull = (value: string | null): Date | null => value ? new Date(value) : null;
export const toDate = (value: string): Date => new Date(value);

// DJ Table - dates stored as ISO strings (compatible with Prisma SQLite format)
export const djs = sqliteTable('DJ', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  avatar: text('avatar'), // Emoji ou URL d'avatar
  color: text('color'), // Couleur personnalisée pour l'UI
  totalPlays: integer('totalPlays').notNull().default(0),
  lastPlayedAt: text('lastPlayedAt'), // ISO date string
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

// Play Table
export const plays = sqliteTable('Play', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  djId: text('djId').notNull().references(() => djs.id, { onDelete: 'cascade' }),
  playedAt: text('playedAt').notNull().$defaultFn(() => new Date().toISOString()), // ISO date string
  notes: text('notes'), // Notes optionnelles sur le blindtest
});

// Settings Table
export const settings = sqliteTable('Settings', {
  id: text('id').primaryKey().default('default'),
  lastSelectedDjId: text('lastSelectedDjId'),
  weightLastPlayed: real('weightLastPlayed').notNull().default(0.6), // Poids pour la date du dernier passage
  weightTotalPlays: real('weightTotalPlays').notNull().default(0.4), // Poids pour le nombre de passages
});

// DJHistory Table
export const djHistory = sqliteTable('DJHistory', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  djName: text('djName').notNull(), // Nom du DJ
  title: text('title').notNull(), // Titre de la musique
  artist: text('artist').notNull(), // Nom de l'artiste
  youtubeUrl: text('youtubeUrl').notNull(), // Lien YouTube
  videoId: text('videoId'), // ID de la vidéo YouTube (pour les thumbnails)
  playedAt: text('playedAt').notNull().$defaultFn(() => new Date().toISOString()), // ISO date string
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

// DailySession Table
export const dailySessions = sqliteTable('DailySession', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  date: text('date').notNull().unique(), // ISO date string - Date de la session (jour ouvrable)
  djId: text('djId'), // DJ assigné (null si pas encore assigné)
  djName: text('djName').notNull(), // Nom du DJ (copié pour l'historique)
  status: text('status').notNull().default('pending'), // pending, completed, skipped
  youtubeUrl: text('youtubeUrl'), // Lien YouTube ajouté après le blindtest
  videoId: text('videoId'), // ID vidéo YouTube
  title: text('title'), // Titre de la musique
  artist: text('artist'), // Artiste
  skipReason: text('skipReason'), // Raison de l'annulation (ex: "Daily annulée")
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

// Relations
export const djsRelations = relations(djs, ({ many }) => ({
  plays: many(plays),
}));

export const playsRelations = relations(plays, ({ one }) => ({
  dj: one(djs, {
    fields: [plays.djId],
    references: [djs.id],
  }),
}));

// Types inférés
export type DJ = typeof djs.$inferSelect;
export type NewDJ = typeof djs.$inferInsert;
export type Play = typeof plays.$inferSelect;
export type NewPlay = typeof plays.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
export type DJHistory = typeof djHistory.$inferSelect;
export type NewDJHistory = typeof djHistory.$inferInsert;
export type DailySession = typeof dailySessions.$inferSelect;
export type NewDailySession = typeof dailySessions.$inferInsert;
