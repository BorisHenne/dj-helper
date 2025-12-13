import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const toISOString = (date: Date): string => date.toISOString();
export const toDateOrNull = (value: string | null): Date | null => value ? new Date(value) : null;
export const toDate = (value: string): Date => new Date(value);

export const djs = sqliteTable('DJ', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  avatar: text('avatar'),
  color: text('color'),
  totalPlays: integer('totalPlays').notNull().default(0),
  lastPlayedAt: text('lastPlayedAt'),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const plays = sqliteTable('Play', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  djId: text('djId').notNull().references(() => djs.id, { onDelete: 'cascade' }),
  playedAt: text('playedAt').notNull().$defaultFn(() => new Date().toISOString()),
  notes: text('notes'),
});

export const settings = sqliteTable('Settings', {
  id: text('id').primaryKey().default('default'),
  lastSelectedDjId: text('lastSelectedDjId'),
  weightLastPlayed: real('weightLastPlayed').notNull().default(0.6),
  weightTotalPlays: real('weightTotalPlays').notNull().default(0.4),
  lastRegistrationDate: text('lastRegistrationDate'),
  registrationLocked: integer('registrationLocked', { mode: 'boolean' }).default(false),
});

export const djHistory = sqliteTable('DJHistory', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  djName: text('djName').notNull(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  youtubeUrl: text('youtubeUrl').notNull(),
  videoId: text('videoId'),
  playedAt: text('playedAt').notNull().$defaultFn(() => new Date().toISOString()),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const dailySessions = sqliteTable('DailySession', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  date: text('date').notNull().unique(),
  djId: text('djId'),
  djName: text('djName').notNull(),
  status: text('status').notNull().default('pending'),
  youtubeUrl: text('youtubeUrl'),
  videoId: text('videoId'),
  title: text('title'),
  artist: text('artist'),
  skipReason: text('skipReason'),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const djsRelations = relations(djs, ({ many }) => ({
  plays: many(plays),
}));

export const playsRelations = relations(plays, ({ one }) => ({
  dj: one(djs, {
    fields: [plays.djId],
    references: [djs.id],
  }),
}));

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
