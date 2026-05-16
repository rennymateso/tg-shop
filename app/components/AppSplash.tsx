"use client";

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
            18px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
          animation: mnSplashFadeOut 0.38s ease forwards;
          animation-delay: 3.12s;
        }

        .mn-splash-box {
          width: 100%;
          max-width: 430px;
          text-align: center;
          transform: translateY(2px);
        }

        .mn-logo-line {
          width: 100%;
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .mn-logo-word {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: 94vw;
          white-space: nowrap;
          color: #fff;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;
          font-size: clamp(34px, 9vw, 44px);
          line-height: 1;
          font-weight: 760;
          letter-spacing: 0.13em;
        }

        .mn-logo-mo {
          display: inline-block;
          transform-origin: center;
          opacity: 0;
          filter: blur(12px);
          transform: scale(0.42);
          animation: mnMoFromFar 0.86s cubic-bezier(.18,.9,.2,1) forwards;
        }

        .mn-logo-rest {
          display: inline-flex;
          align-items: center;
          max-width: 0;
          overflow: hidden;
          white-space: nowrap;
          animation: mnOpenRest 1.18s cubic-bezier(.2,.82,.2,1) forwards;
          animation-delay: 0.92s;
        }

        .mn-rest-letter {
          display: inline-block;
          opacity: 0;
          filter: blur(9px);
          transform: translateX(13px);
          animation: mnLetterIn 0.48s ease forwards;
        }

        .mn-rest-letter:nth-child(1) { animation-delay: 1.02s; }
        .mn-rest-letter:nth-child(2) { animation-delay: 1.16s; }
        .mn-rest-letter:nth-child(3) { animation-delay: 1.30s; }
        .mn-rest-letter:nth-child(4) { animation-delay: 1.44s; }
        .mn-rest-letter:nth-child(5) { animation-delay: 1.58s; }
        .mn-rest-letter:nth-child(6) { animation-delay: 1.72s; }
        .mn-rest-letter:nth-child(7) { animation-delay: 1.86s; }

        .mn-splash-tagline {
          margin-top: 17px;
          color: rgba(255,255,255,.48);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;
          font-size: 12px;
          line-height: 1;
          font-weight: 560;
          letter-spacing: .32em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(8px);
          animation: mnTaglineIn .48s ease forwards;
          animation-delay: 2.15s;
        }

        @keyframes mnMoFromFar {
          0% {
            opacity: 0;
            filter: blur(12px);
            transform: scale(0.42);
          }
          62% {
            opacity: 1;
            filter: blur(1px);
            transform: scale(1.08);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: scale(1);
          }
        }

        @keyframes mnOpenRest {
          0% { max-width: 0; }
          100% { max-width: 18em; }
        }

        @keyframes mnLetterIn {
          0% {
            opacity: 0;
            filter: blur(9px);
            transform: translateX(13px);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateX(0);
          }
        }

        @keyframes mnTaglineIn {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
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
            font-size: 32px;
            letter-spacing: .105em;
          }

          .mn-splash-tagline {
            font-size: 11px;
            letter-spacing: .28em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-logo-mo,
          .mn-logo-rest,
          .mn-rest-letter,
          .mn-splash-tagline {
            animation: none !important;
          }

          .mn-logo-mo,
          .mn-rest-letter,
          .mn-splash-tagline {
            opacity: 1;
            filter: none;
            transform: none;
          }

          .mn-logo-rest {
            max-width: 18em;
          }
        }
      `}</style>

      <div className="mn-splash-box">
        <div className="mn-logo-line">
          <div className="mn-logo-word" aria-label="MONTREAUX">
            <span className="mn-logo-mo">MO</span>
            <span className="mn-logo-rest" aria-hidden="true">
              {restLetters.map((letter, index) => (
                <span className="mn-rest-letter" key={`${letter}-${index}`}>
                  {letter}
                </span>
              ))}
            </span>
          </div>
        </div>

        <div className="mn-splash-tagline">FASHION</div>
      </div>
    </div>
  );
}
