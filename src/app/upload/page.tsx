import { Header, Footer } from "@/components/ui";
import { UploadForm } from "@/components/upload";

export const metadata = {
  title: "Enviar Vídeo | GUESTALT AR",
  description: "Faça upload do seu vídeo para visualização em Realidade Aumentada.",
};

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-guestalt-black">
      <Header />

      <section className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-heading font-bold text-3xl sm:text-4xl mb-4">
              Enviar Vídeo
            </h1>
            <p className="text-guestalt-gray-light">
              Faça upload do seu vídeo para visualização em Realidade Aumentada.
            </p>
          </div>

          {/* Upload Form */}
          <UploadForm />
        </div>
      </section>

      <Footer />
    </main>
  );
}
