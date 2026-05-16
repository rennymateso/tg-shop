"use client";

const letters = ["M", "O", "N", "T", "R", "E", "A", "U", "X"];

export default function AppSplash() {
  return (
    <div className="mn-splash" aria-label="Загрузка MONTREAUX">
      <style>{`
        .mn-splash {
          position: fixed;
          inset: 0;
          z-index: 9999;
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          overflow: hidden;
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding:
            calc(env(safe-area-inset-top, 0px) + 24px)
            18px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
          animation: mnSplashFadeOut 0.45s ease forwards;
          animation-delay: 2.65s;
        }

        .mn-splash-inner {
          position: relative;
          width: 100%;
          max-width: 430px;
          text-align: center;
          transform: translateY(4px);
        }

        .mn-logo-window {
          position: relative;
          width: 100%;
          height: clamp(56px, 15vw, 82px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .mn-logo-word {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: clamp(2px, 0.9vw, 6px);
          white-space: nowrap;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;
          font-size: clamp(34px, 9.4vw, 52px);
          line-height: 0.9;
          font-weight: 800;
          letter-spacing: 0.055em;
          transform: translateX(38%);
          animation: mnWordShift 0.82s cubic-bezier(.22,.9,.18,1) forwards;
          animation-delay: 0.72s;
          will-change: transform;
        }

        .mn-letter {
          display: inline-block;
          opacity: 0;
          transform: translateX(18px);
          filter: blur(7px);
          will-change: opacity, transform, filter;
        }

        .mn-letter:nth-child(1),
        .mn-letter:nth-child(2) {
          opacity: 1;
          transform: translateX(0);
          filter: blur(0);
          animation: mnMoPulse 0.5s ease forwards;
          animation-delay: 0.08s;
        }

        .mn-letter:nth-child(3) { animation: mnLetterJoin 0.58s cubic-bezier(.22,.9,.18,1) forwards; animation-delay: 0.80s; }
        .mn-letter:nth-child(4) { animation: mnLetterJoin 0.58s cubic-bezier(.22,.9,.18,1) forwards; animation-delay: 0.88s; }
        .mn-letter:nth-child(5) { animation: mnLetterJoin 0.58s cubic-bezier(.22,.9,.18,1) forwards; animation-delay: 0.96s; }
        .mn-letter:nth-child(6) { animation: mnLetterJoin 0.58s cubic-bezier(.22,.9,.18,1) forwards; animation-delay: 1.04s; }
        .mn-letter:nth-child(7) { animation: mnLetterJoin 0.58s cubic-bezier(.22,.9,.18,1) forwards; animation-delay: 1.12s; }
        .mn-letter:nth-child(8) { animation: mnLetterJoin 0.58s cubic-bezier(.22,.9,.18,1) forwards; animation-delay: 1.20s; }
        .mn-letter:nth-child(9) { animation: mnLetterJoin 0.58s cubic-bezier(.22,.9,.18,1) forwards; animation-delay: 1.28s; }

        .mn-tagline {
          margin-top: 18px;
          color: rgba(255,255,255,0.48);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;
          font-size: clamp(11px, 3vw, 14px);
          line-height: 1;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(8px);
          animation: mnTaglineIn 0.6s ease forwards;
          animation-delay: 1.42s;
        }

        .mn-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 260px;
          height: 120px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,255,255,0.10), transparent 66%);
          opacity: 0;
          animation: mnGlowIn 1.35s ease forwards;
          animation-delay: 0.3s;
          pointer-events: none;
        }

        @keyframes mnWordShift {
          from { transform: translateX(38%); }
          to { transform: translateX(0); }
        }

        @keyframes mnMoPulse {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes mnLetterJoin {
          0% {
            opacity: 0;
            transform: translateX(18px);
            filter: blur(7px);
          }
          68% {
            opacity: 1;
            transform: translateX(-1px);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }

        @keyframes mnTaglineIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes mnGlowIn {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.84); }
          45% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.08); }
        }

        @keyframes mnSplashFadeOut {
          from {
            opacity: 1;
            visibility: visible;
          }
          to {
            opacity: 0;
            visibility: hidden;
          }
        }

        @media (max-width: 360px) {
          .mn-logo-word {
            font-size: 33px;
            letter-spacing: 0.045em;
            gap: 2px;
          }

          .mn-tagline {
            font-size: 10.5px;
            letter-spacing: 0.24em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-logo-word,
          .mn-letter,
          .mn-tagline,
          .mn-glow {
            animation: none !important;
          }

          .mn-logo-word {
            transform: translateX(0);
          }

          .mn-letter,
          .mn-tagline {
            opacity: 1;
            transform: none;
            filter: none;
          }
        }
      `}</style>

      <div className="mn-splash-inner">
        <div className="mn-logo-window">
          <div className="mn-glow" />
          <div className="mn-logo-word" aria-label="MONTREAUX">
            {letters.map((letter, index) => (
              <span className="mn-letter" key={`${letter}-${index}`}>
                {letter}
              </span>
            ))}
          </div>
        </div>

        <div className="mn-tagline">FASHION</div>
      </div>
    </div>
  );
}
