import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const batchTable = pgTable("batch", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const userTable = pgTable("user_session", {
  id: serial("id").primaryKey(),
  session_id: text("session_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  batch_id: integer("batch_id").references(() => batchTable.id),
  meta: jsonb("meta"),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export const imageBatchTable = pgTable("image_batch", {
  id: serial("id").primaryKey(),
  class_name: text("class_name").notNull(),
  batch_id: integer("batch_id").references(() => batchTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export const imageTable = pgTable("image", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  is_first_image: boolean("is_first_image").default(false),
  image_batch_id: integer("image_batch_id").references(() => imageBatchTable.id),
  imageKey: varchar("image_key").notNull(),
  deleted_from_s3: boolean("deleted_from_s3").default(false),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export const resultsTable = pgTable("results", {
  id: serial("id").primaryKey(),
  image_id: integer("image_id").references(() => imageTable.id),
  user_id: integer("user_id").references(() => userTable.id),
  score: integer("score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export const batchRelations = relations(batchTable, ({ many }) => ({
  users: many(userTable),
  imageBatches: many(imageBatchTable),
}));

export const userRelations = relations(userTable, ({ one }) => ({
  batch: one(batchTable, {
    fields: [userTable.batch_id],
    references: [batchTable.id],
  }),
}));

export const imageBatchRelations = relations(imageBatchTable, ({ one, many }) => ({
  batch: one(batchTable, {
    fields: [imageBatchTable.batch_id],
    references: [batchTable.id],
  }),
  images: many(imageTable),
}));

export const imageRelations = relations(imageTable, ({ one }) => ({
  imageBatch: one(imageBatchTable, {
    fields: [imageTable.image_batch_id],
    references: [imageBatchTable.id],
  }),
}));

export const resultRelations = relations(resultsTable, ({ one }) => ({
  image: one(imageTable, {
    fields: [resultsTable.image_id],
    references: [imageTable.id],
  }),
  user: one(userTable, {
    fields: [resultsTable.user_id],
    references: [userTable.id],
  }),
}));
