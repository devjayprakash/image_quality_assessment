"use server";

import { db } from "@/db";
import { imageBatchTable } from "@/db/schema";
import { asc } from "drizzle-orm";

const prepareLabelingData = async () => {
  const imageBatchId = await db
    .select({})
    .from(imageBatchTable)
    .orderBy(asc(imageBatchTable.createdAt))
    .limit(1)
    .execute();
  return imageBatchId;
};
