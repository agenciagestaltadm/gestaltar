import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-guestalt-black/90 backdrop-blur-sm border-b border-guestalt-gray-medium">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.svg"
                alt="GUESTALT AR Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight group-hover:text-guestalt-gray-light transition-colors">
              GUESTALT AR
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/upload"
              className="text-guestalt-gray-light hover:text-white transition-colors text-sm font-medium"
            >
              Enviar Vídeo
            </Link>
            <Link
              href="/ar"
              className="text-guestalt-gray-light hover:text-white transition-colors text-sm font-medium"
            >
              Ler Quadro AR
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
