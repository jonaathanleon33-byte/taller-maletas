// Franja decorativa animada para el tope del inicio, en el lugar que
// antes ocupaba la foto del equipo — la mascota "camina" de un lado
// al otro en loop (recorrido + rebote), sin JS, solo CSS.
export function MascotaCaminando() {
  return (
    <div className="relative h-28 w-full overflow-hidden bg-gradient-to-b from-blue-50 to-white sm:h-36">
      <div className="mascota-pista absolute bottom-3">
        <div className="mascota-sombra mx-auto h-2 w-14 rounded-full bg-slate-900/10 blur-[2px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascota/pose-06.png"
          alt=""
          className="mascota-rebote h-20 w-auto sm:h-28"
        />
      </div>

      <style>{`
        .mascota-pista {
          left: -20%;
          animation: mascota-recorrido 9s linear infinite;
        }
        .mascota-rebote {
          animation: mascota-rebote 0.55s ease-in-out infinite;
        }
        .mascota-sombra {
          animation: mascota-sombra 0.55s ease-in-out infinite;
        }
        @keyframes mascota-recorrido {
          0% { left: -20%; }
          100% { left: 115%; }
        }
        @keyframes mascota-rebote {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes mascota-sombra {
          0%, 100% { transform: scaleX(1); opacity: 0.5; }
          50% { transform: scaleX(0.7); opacity: 0.3; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mascota-pista, .mascota-rebote, .mascota-sombra {
            animation: none;
            left: 50%;
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
