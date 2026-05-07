import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-border mt-12 py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center gap-2">
            <Image src="/logo-assinei.png" alt="Assinei" width={20} height={20} className="rounded-md opacity-80" />
            <p className="font-medium text-foreground">Assinei</p>
          </div>
          <p className="text-xs">Suas assinaturas, sob controle. 💸</p>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs italic opacity-70">
            "Se você não sabe quanto gasta por mês, este app é pra você."
          </p>
        </div>

        <div className="text-center sm:text-right space-y-1">
          <p className="text-xs">
            Feito com{" "}
            <span className="text-red-500 dark:text-red-400" aria-label="amor">♥</span>
            {" "}por{" "}
            <Link
              href="https://devjoseh.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline underline-offset-2 transition-colors"
            >
              @devjoseh
            </Link>
          </p>
          <p className="text-[11px] opacity-50">open source · MIT license</p>
        </div>
      </div>
    </footer>
  )
}
