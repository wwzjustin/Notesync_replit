import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  parentId: varchar("parent_id"),
  path: text("path").notNull(), // For hierarchical queries
  level: integer("level").default(0),
  noteCount: integer("note_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: jsonb("content"), // Rich text content as JSON
  plainContent: text("plain_content"), // For search
  folderId: varchar("folder_id").references(() => folders.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  parentId: varchar("parent_id"),
  level: integer("level").default(0),
  isLocked: boolean("is_locked").default(false),
  wordCount: integer("word_count").default(0),
  characterCount: integer("character_count").default(0),
  hasAttachments: boolean("has_attachments").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shareLinks = pgTable("share_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").references(() => notes.id),
  url: text("url").notNull().unique(),
  permissions: text("permissions").default("view"), // "view", "edit"
  expiresAt: timestamp("expires_at"),
  accessCount: integer("access_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  noteCount: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  wordCount: true,
  characterCount: true,
});

export const insertShareLinkSchema = createInsertSchema(shareLinks).omit({
  id: true,
  createdAt: true,
  accessCount: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type ShareLink = typeof shareLinks.$inferSelect;
export type InsertShareLink = z.infer<typeof insertShareLinkSchema>;

// Relations
export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
  }),
  children: many(folders),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [notes.folderId],
    references: [folders.id],
  }),
  parent: one(notes, {
    fields: [notes.parentId],
    references: [notes.id],
  }),
  children: many(notes),
  shareLinks: many(shareLinks),
}));

export const usersRelations = relations(users, ({ many }) => ({
  folders: many(folders),
  notes: many(notes),
}));

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  note: one(notes, {
    fields: [shareLinks.noteId],
    references: [notes.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;