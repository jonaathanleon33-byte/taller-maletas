// Varias maletitas caminando por toda la pantalla (no solo en una
// franja): posición fija respecto a la ventana, así se siguen viendo
// sin importar el scroll. No capturan clics (pointer-events: none)
// para no estorbar los botones que pasan por debajo.
const MASCOTAS = [
  { src: "/mascota/pose-04.png", top: "10%", size: 60, duration: 17, delay: -3, reverse: false },
  { src: "/mascota/pose-06.png", top: "32%", size: 52, duration: 13, delay: -8, reverse: true },
  { src: "/mascota/pose-07.png", top: "58%", size: 64, duration: 20, delay: -1, reverse: false },
  { src: "/mascota/pose-11.png", top: "82%", size: 54, duration: 15, delay: -11, reverse: true },
] as const;

export function MascotasAmbiente() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
      aria-hidden="true"
    >
      {MASCOTAS.map((m) => (
        <div
          key={m.src}
          className="mascota-pista absolute"
          style={{
            top: m.top,
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
            animationDirection: m.reverse ? "reverse" : "normal",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.src}
            alt=""
            className="mascota-rebote"
            style={{
              height: m.size,
              width: "auto",
              transform: m.reverse ? "scaleX(-1)" : undefined,
            }}
          />
        </div>
      ))}

      <style>{`
        .mascota-pista {
          left: -15%;
          animation-name: mascota-recorrido;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .mascota-rebote {
          animation: mascota-rebote 0.55s ease-in-out infinite;
        }
        @keyframes mascota-recorrido {
          0% { left: -15%; }
          100% { left: 108%; }
        }
        @keyframes mascota-rebote {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mascota-pista, .mascota-rebote {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
