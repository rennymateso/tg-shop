"use client";

const firstLetters = ["M", "O"];
const restLetters = ["N", "T", "R", "E", "A", "U", "X"];

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
          animation-delay: 2.65s;
        }

        .mn-splash::before {
          content: "";
          position: absolute;
          inset: -28%;
          background:
            radial-gradient(circle at 50% 46%, rgba(255,255,255,0.09), transparent 22%),
            radial-gradient(circle at 50% 58%, rgba(255,255,255,0.045), transparent 18%);
          opacity: 0;
          animation: mnGlow 2.15s ease forwards;
        }

        .mn-splash-inner {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 360px;
          text-align: center;
          transform: translateY(2px);
        }

        .mn-splash-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: clamp(2px, 0.8vw, 5px);
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
          font-size: clamp(30px, 8.4vw, 46px);
          line-height: 0.95;
          font-weight: 760;
          letter-spacing: 0.075em;
        }

        .mn-splash-first {
          display: inline-flex;
          gap: clamp(2px, 0.8vw, 5px);
          animation: mnFirstMove 0.72s cubic-bezier(.2,.9,.18,1) forwards;
          animation-delay: 0.82s;
          will-change: transform;
        }

        .mn-splash-rest {
          display: inline-flex;
          gap: clamp(2px, 0.8vw, 5px);
        }

        .mn-splash-letter {
          display: inline-block;
          will-change: transform, opacity, filter;
        }

        .mn-splash-first .mn-splash-letter {
          opacity: 0;
          filter: blur(6px);
          transform: translateY(14px) scale(0.95);
          animation: mnLetterIn 0.62s cubic-bezier(.2,.9,.18,1) forwards;
        }

        .mn-splash-first .mn-splash-letter:nth-child(1) { animation-delay: 0.08s; }
        .mn-splash-first .mn-splash-letter:nth-child(2) { animation-delay: 0.16s; }

        .mn-splash-rest .mn-splash-letter {
          opacity: 0;
          filter: blur(6px);
          transform: translateX(-8px) translateY(8px) scale(0.96);
          animation: mnRestLetterIn 0.55s cubic-bezier(.2,.9,.18,1) forwards;
        }

        .mn-splash-rest .mn-splash-letter:nth-child(1) { animation-delay: 0.98s; }
        .mn-splash-rest .mn-splash-letter:nth-child(2) { animation-delay: 1.06s; }
        .mn-splash-rest .mn-splash-letter:nth-child(3) { animation-delay: 1.14s; }
        .mn-splash-rest .mn-splash-letter:nth-child(4) { animation-delay: 1.22s; }
        .mn-splash-rest .mn-splash-letter:nth-child(5) { animation-delay: 1.30s; }
        .mn-splash-rest .mn-splash-letter:nth-child(6) { animation-delay: 1.38s; }
        .mn-splash-rest .mn-splash-letter:nth-child(7) { animation-delay: 1.46s; }

        .mn-splash-tagline {
          margin-top: 18px;
          color: rgba(255,255,255,0.48);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-size: clamp(10px, 2.7vw, 13px);
          line-height: 1;
          font-weight: 600;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(8px);
          animation: mnTaglineIn 0.62s ease forwards;
          animation-delay: 1.72s;
        }

        .mn-splash-line {
          width: 0;
          height: 1px;
          margin: 16px auto 0;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.46),
            transparent
          );
          opacity: 0;
          animation: mnLineIn 0.72s ease forwards;
          animation-delay: 1.86s;
        }

        @keyframes mnLetterIn {
          0% {
            opacity: 0;
            filter: blur(6px);
            transform: translateY(14px) scale(0.95);
          }
          72% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(-1px) scale(1.01);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0) scale(1);
          }
        }

        @keyframes mnRestLetterIn {
          0% {
            opacity: 0;
            filter: blur(6px);
            transform: translateX(-8px) translateY(8px) scale(0.96);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateX(0) translateY(0) scale(1);
          }
        }

        @keyframes mnFirstMove {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(0);
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

        @keyframes mnLineIn {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: min(150px, 40vw);
            opacity: 1;
          }
        }

        @keyframes mnGlow {
          0% { opacity: 0; transform: scale(0.94); }
          48% { opacity: 1; transform: scale(1); }
          100% { opacity: 0.58; transform: scale(1.03); }
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
            font-size: 30px;
            letter-spacing: 0.065em;
            gap: 2px;
          }

          .mn-splash-tagline {
            font-size: 10px;
            letter-spacing: 0.23em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-splash::before,
          .mn-splash-first,
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
            width: min(150px, 40vw);
          }
        }
      `}</style>

      <div className="mn-splash-inner">
        <div className="mn-splash-logo" aria-label="MONTREAUX">
          <span className="mn-splash-first" aria-hidden="true">
            {firstLetters.map((letter, index) => (
              <span className="mn-splash-letter" key={`first-${letter}-${index}`}>
                {letter}
              </span>
            ))}
          </span>

          <span className="mn-splash-rest" aria-hidden="true">
            {restLetters.map((letter, index) => (
              <span className="mn-splash-letter" key={`rest-${letter}-${index}`}>
                {letter}
              </span>
            ))}
          </span>
        </div>

        <div className="mn-splash-tagline">FASHION</div>
        <div className="mn-splash-line" />
      </div>
    </div>
  );
}
