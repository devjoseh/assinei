import { MongoClient } from "mongodb"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const DEFAULT_CATEGORIES = [
  { name: "Streaming",      color: "#E50914", icon: "📺", isDefault: true },
  { name: "SaaS",           color: "#0066FF", icon: "💻", isDefault: true },
  { name: "Jogos",          color: "#9B59B6", icon: "🎮", isDefault: true },
  { name: "Educação",       color: "#27AE60", icon: "📚", isDefault: true },
  { name: "Música",         color: "#1DB954", icon: "🎵", isDefault: true },
  { name: "Notícias",       color: "#E67E22", icon: "📰", isDefault: true },
  { name: "Produtividade",  color: "#3498DB", icon: "⚡", isDefault: true },
  { name: "Segurança",      color: "#E74C3C", icon: "🔒", isDefault: true },
  { name: "Armazenamento",  color: "#95A5A6", icon: "💾", isDefault: true },
  { name: "Outros",         color: "#7F8C8D", icon: "📦", isDefault: true },
]

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error("Missing MONGODB_URI in .env.local")
    process.exit(1)
  }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db()

  const user = await db.collection("users").findOne(
    {},
    { sort: { createdAt: 1 } }
  )

  if (!user) {
    console.error("No users found. Run seed-admin.ts first.")
    await client.close()
    process.exit(1)
  }

  const now = new Date()
  let inserted = 0

  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const cat = DEFAULT_CATEGORIES[i]
    const result = await db.collection("categories").updateOne(
      { userId: user._id, name: cat.name },
      {
        $setOnInsert: {
          userId: user._id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          isDefault: true,
          isHidden: false,
          order: i,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    )
    if (result.upsertedCount > 0) inserted++
  }

  // Ensure unique index on userId + name (case-insensitive collation)
  try {
    await db.collection("categories").createIndex(
      { userId: 1, name: 1 },
      { unique: true, collation: { locale: "en", strength: 2 } }
    )
  } catch {
    // Index already exists, ignore
  }

  console.log(`Categories seeded: ${inserted} inserted, ${DEFAULT_CATEGORIES.length - inserted} already existed`)
  await client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
