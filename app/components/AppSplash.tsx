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
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          overflow: hidden;
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding:
            calc(env(safe-area-inset-top, 0px) + 24px)
            24px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
          animation: mnSplashExit 0.55s ease forwards;
          animation-delay: 2.55s;
        }

        .mn-splash::before {
          content: "";
          position: absolute;
          inset: -30%;
          background:
            radial-gradient(circle at 50% 44%, rgba(255,255,255,0.10), transparent 22%),
            radial-gradient(circle at 50% 56%, rgba(255,255,255,0.06), transparent 18%);
          opacity: 0;
          animation: mnGlow 2.2s ease forwards;
        }

        .mn-splash-inner {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 390px;
          text-align: center;
          transform: translateY(4px);
        }

        .mn-splash-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: clamp(3px, 1.2vw, 7px);
          max-width: 100%;
          white-space: nowrap;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-size: clamp(38px, 11vw, 62px);
          line-height: 0.95;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .mn-splash-letter {
          display: inline-block;
          opacity: 0;
          filter: blur(7px);
          transform: translateY(18px) scale(0.94);
          animation: mnLetterIn 0.72s cubic-bezier(.2,.9,.18,1) forwards;
          will-change: transform, opacity, filter;
        }

        .mn-splash-letter:nth-child(1) { animation-delay: 0.08s; }
        .mn-splash-letter:nth-child(2) { animation-delay: 0.14s; }
        .mn-splash-letter:nth-child(3) { animation-delay: 0.46s; }
        .mn-splash-letter:nth-child(4) { animation-delay: 0.54s; }
        .mn-splash-letter:nth-child(5) { animation-delay: 0.62s; }
        .mn-splash-letter:nth-child(6) { animation-delay: 0.70s; }
        .mn-splash-letter:nth-child(7) { animation-delay: 0.78s; }
        .mn-splash-letter:nth-child(8) { animation-delay: 0.86s; }
        .mn-splash-letter:nth-child(9) { animation-delay: 0.94s; }

        .mn-splash-tagline {
          margin-top: 22px;
          color: rgba(255,255,255,0.48);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-size: clamp(12px, 3.2vw, 15px);
          line-height: 1;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(10px);
          animation: mnTaglineIn 0.72s ease forwards;
          animation-delay: 1.25s;
        }

        .mn-splash-line {
          width: 0;
          height: 1px;
          margin: 20px auto 0;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.58),
            transparent
          );
          opacity: 0;
          animation: mnLineIn 0.85s ease forwards;
          animation-delay: 1.42s;
        }

        @keyframes mnLetterIn {
          0% {
            opacity: 0;
            filter: blur(7px);
            transform: translateY(18px) scale(0.94);
          }
          68% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(-2px) scale(1.015);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0) scale(1);
          }
        }

        @keyframes mnTaglineIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes mnLineIn {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: min(178px, 46vw);
            opacity: 1;
          }
        }

        @keyframes mnGlow {
          0% { opacity: 0; transform: scale(0.9); }
          45% { opacity: 1; transform: scale(1); }
          100% { opacity: 0.65; transform: scale(1.04); }
        }

        @keyframes mnSplashExit {
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
          .mn-splash-logo {
            font-size: 36px;
            letter-spacing: 0.065em;
            gap: 3px;
          }

          .mn-splash-tagline {
            font-size: 11px;
            letter-spacing: 0.24em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-splash::before,
          .mn-splash-letter,
          .mn-splash-tagline,
          .mn-splash-line {
            animation: none !important;
          }

          .mn-splash-letter,
          .mn-splash-tagline,
          .mn-splash-line {
            opacity: 1;
            filter: none;
            transform: none;
          }

          .mn-splash-line {
            width: min(178px, 46vw);
          }
        }
      `}</style>

      <div className="mn-splash-inner">
        <div className="mn-splash-logo" aria-label="MONTREAUX">
          {letters.map((letter, index) => (
            <span className="mn-splash-letter" key={`${letter}-${index}`}>
              {letter}
            </span>
          ))}
        </div>

        <div className="mn-splash-tagline">FASHION</div>
        <div className="mn-splash-line" />
      </div>
    </div>
  );
}