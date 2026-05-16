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
            24px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
          animation: mnSplashExit 0.75s ease forwards;
          animation-delay: 4.35s;
        }

        .mn-splash-inner {
          width: 100%;
          max-width: 430px;
          text-align: center;
          transform: translateY(4px);
        }

        .mn-logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .mn-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          color: #fff;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-size: clamp(31px, 8.7vw, 46px);
          line-height: 0.95;
          font-weight: 760;
          letter-spacing: 0.13em;
        }

        .mn-first-group {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transform-origin: center center;
          animation: mnMOFromFar 1.25s cubic-bezier(.18,.88,.18,1) forwards;
        }

        .mn-letter {
          display: inline-block;
        }

        .mn-rest-letter {
          display: inline-block;
          width: 0;
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateX(18px);
          filter: blur(6px);
          animation: mnLetterInsert 0.78s cubic-bezier(.22,.82,.18,1) forwards;
        }

        .mn-rest-letter:nth-child(3) { animation-delay: 1.35s; }
        .mn-rest-letter:nth-child(4) { animation-delay: 1.62s; }
        .mn-rest-letter:nth-child(5) { animation-delay: 1.89s; }
        .mn-rest-letter:nth-child(6) { animation-delay: 2.16s; }
        .mn-rest-letter:nth-child(7) { animation-delay: 2.43s; }
        .mn-rest-letter:nth-child(8) { animation-delay: 2.70s; }
        .mn-rest-letter:nth-child(9) { animation-delay: 2.97s; }

        .mn-tagline {
          margin-top: 22px;
          color: rgba(255,255,255,0.44);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-size: clamp(11px, 3vw, 14px);
          line-height: 1;
          font-weight: 520;
          letter-spacing: 0.30em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(10px);
          animation: mnTaglineIn 0.9s ease forwards;
          animation-delay: 3.55s;
        }

        .mn-light {
          width: 0;
          height: 1px;
          margin: 18px auto 0;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.46), transparent);
          opacity: 0;
          animation: mnLightIn 0.9s ease forwards;
          animation-delay: 3.72s;
        }

        @keyframes mnMOFromFar {
          0% {
            opacity: 0;
            transform: scale(0.52);
            filter: blur(14px);
            letter-spacing: 0.22em;
          }
          54% {
            opacity: 1;
            transform: scale(1.08);
            filter: blur(0);
            letter-spacing: 0.15em;
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
            letter-spacing: 0.13em;
          }
        }

        @keyframes mnLetterInsert {
          0% {
            width: 0;
            max-width: 0;
            opacity: 0;
            transform: translateX(18px);
            filter: blur(6px);
          }
          45% {
            width: 1.02em;
            max-width: 1.02em;
            opacity: .55;
            transform: translateX(8px);
            filter: blur(3px);
          }
          100% {
            width: 1.02em;
            max-width: 1.02em;
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
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

        @keyframes mnLightIn {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: min(148px, 38vw);
            opacity: .65;
          }
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
          .mn-logo {
            font-size: 30px;
            letter-spacing: 0.105em;
          }

          .mn-tagline {
            font-size: 10.5px;
            letter-spacing: 0.26em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-first-group,
          .mn-rest-letter,
          .mn-tagline,
          .mn-light {
            animation: none !important;
          }

          .mn-first-group,
          .mn-rest-letter,
          .mn-tagline {
            opacity: 1;
            transform: none;
            filter: none;
          }

          .mn-rest-letter {
            width: 1.02em;
            max-width: 1.02em;
          }

          .mn-light {
            width: min(148px, 38vw);
            opacity: .65;
          }
        }
      `}</style>

      <div className="mn-splash-inner">
        <div className="mn-logo-wrap">
          <div className="mn-logo" aria-label="MONTREAUX">
            <span className="mn-first-group">
              {firstLetters.map((letter, index) => (
                <span className="mn-letter" key={`${letter}-${index}`}>
                  {letter}
                </span>
              ))}
            </span>

            {restLetters.map((letter, index) => (
              <span className="mn-rest-letter" key={`${letter}-${index}`}>
                {letter}
              </span>
            ))}
          </div>
        </div>

        <div className="mn-tagline">FASHION</div>
        <div className="mn-light" />
      </div>
    </div>
  );
}
