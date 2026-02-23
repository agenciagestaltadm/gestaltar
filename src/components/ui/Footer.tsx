import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-guestalt-surface border-t border-guestalt-gray-medium">
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-lg">GUESTALT AR</span>
            <span className="text-guestalt-gray-light text-sm">
              © {currentYear}
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-guestalt-gray-light">
            <Link
              href="/upload"
              className="hover:text-white transition-colors"
            >
              Enviar Vídeo
            </Link>
            <Link href="/ar" className="hover:text-white transition-colors">
              Ler Quadro AR
            </Link>
          </div>

          <div className="text-sm text-guestalt-gray-light">
            <span>Gestalt Comunicação</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
