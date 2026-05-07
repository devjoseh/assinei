import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"

export default async function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/")

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
