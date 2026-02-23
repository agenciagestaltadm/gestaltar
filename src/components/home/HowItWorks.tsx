const steps = [
  {
    number: "1",
    title: "ENVIE",
    description: "Faça upload do vídeo",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    ),
  },
  {
    number: "2",
    title: "APONTE",
    description: "Aponte a câmera para o quadro",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    number: "3",
    title: "ASSISTA",
    description: "Veja o vídeo ganhar vida",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 px-4 bg-guestalt-surface">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-center mb-12">
          Como Funciona
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="flex flex-col items-center text-center animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-full border-2 border-guestalt-gray-medium flex items-center justify-center mb-4 text-guestalt-gray-light">
                {step.icon}
              </div>

              {/* Number */}
              <div className="w-8 h-8 rounded-full bg-white text-black font-bold text-sm flex items-center justify-center mb-3">
                {step.number}
              </div>

              {/* Title */}
              <h3 className="font-heading font-semibold text-lg mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-guestalt-gray-light text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
