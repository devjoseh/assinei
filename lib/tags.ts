import { Db, ObjectId } from "mongodb"

export async function upsertTagsHistory(db: Db, userId: ObjectId, tags: string[]) {
  if (!tags.length) return
  const now = new Date()
  await Promise.all(
    tags.map((tag) =>
      db.collection("tags_history").updateOne(
        { userId, tag },
        {
          $inc: { usageCount: 1 },
          $set: { lastUsedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      )
    )
  )
}
