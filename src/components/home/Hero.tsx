import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center pt-16 pb-8 px-4">
      <div className="text-center max-w-3xl mx-auto animate-fade-in">
        {/* Logo / Title */}
        <h1 className="font-heading font-extrabold text-5xl sm:text-6xl md:text-7xl tracking-tight mb-6">
          GUESTALT AR
        </h1>

        {/* Subtitle */}
        <p className="text-guestalt-gray-light text-lg sm:text-xl md:text-2xl mb-12 max-w-xl mx-auto leading-relaxed">
          Aponte para o quadro.
          <br />
          <span className="text-white">Veja a imagem ganhar vida.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Button href="/upload" variant="primary" size="lg">
            ENVIAR O VÍDEO
          </Button>

          <Button href="/ar" variant="secondary" size="lg">
            LER O QUADRO EM AR
            <br />
            <span className="text-xs opacity-80">(REALIDADE AUMENTADA)</span>
          </Button>
        </div>

        {/* Decorative element */}
        <div className="mt-16 flex justify-center">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-guestalt-gray-medium to-transparent" />
        </div>
      </div>
    </section>
  );
}
