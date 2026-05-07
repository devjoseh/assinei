import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

async function main() {
  const uri = process.env.MONGODB_URI
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!uri || !email || !password) {
    console.error("Missing MONGODB_URI, ADMIN_EMAIL, or ADMIN_PASSWORD in .env.local")
    process.exit(1)
  }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db()

  const existing = await db.collection("users").findOne({ email })
  if (existing) {
    console.log(`Admin user already exists: ${email}`)
    await client.close()
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await db.collection("users").insertOne({
    email,
    passwordHash,
    createdAt: new Date(),
  })

  console.log(`Admin user created: ${email}`)
  await client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
