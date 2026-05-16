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
            20px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
          animation: mnSplashFadeOut 0.42s ease forwards;
          animation-delay: 3.08s;
        }

        .mn-splash-inner {
          position: relative;
          width: 100%;
          max-width: 430px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          transform: translateY(8px);
        }

        .mn-logo-wrap {
          width: 100%;
          display: flex;
          justify-content: center;
          overflow: visible;
        }

        .mn-word {
          --step: 0.58em;
          --initial-shift: 2.18em;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          white-space: nowrap;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-size: clamp(38px, 9.9vw, 48px);
          line-height: 0.92;
          font-weight: 800;
          letter-spacing: 0.075em;
          transform: translateX(var(--initial-shift));
          animation: mnWordCenter 1.05s cubic-bezier(.18,.86,.22,1) forwards;
          animation-delay: 1.02s;
          will-change: transform;
        }

        .mn-mo {
          position: relative;
          z-index: 2;
          display: inline-block;
          opacity: 0;
          filter: blur(18px);
          transform: scale(0.34);
          transform-origin: center;
          animation: mnMoFlash 1.02s cubic-bezier(.16,.9,.19,1) forwards;
          will-change: opacity, filter, transform;
        }

        .mn-rest {
          position: relative;
          display: inline-block;
          width: calc(var(--step) * 7.1);
          height: 1em;
          margin-left: 0.08em;
          vertical-align: top;
          overflow: visible;
        }

        .mn-rest-letter {
          position: absolute;
          left: 0;
          top: 0;
          display: inline-block;
          opacity: 0;
          filter: blur(12px);
          transform: translateX(0) scale(0.98);
          transform-origin: center;
          animation: mnRestSpread 0.98s cubic-bezier(.18,.86,.22,1) forwards;
          animation-delay: 1.08s;
          will-change: opacity, filter, transform;
        }

        .mn-rest-letter:nth-child(1) { --x: 0em; }
        .mn-rest-letter:nth-child(2) { --x: calc(var(--step) * 1); }
        .mn-rest-letter:nth-child(3) { --x: calc(var(--step) * 2); }
        .mn-rest-letter:nth-child(4) { --x: calc(var(--step) * 3); }
        .mn-rest-letter:nth-child(5) { --x: calc(var(--step) * 4); }
        .mn-rest-letter:nth-child(6) { --x: calc(var(--step) * 5); }
        .mn-rest-letter:nth-child(7) { --x: calc(var(--step) * 6); }

        .mn-tagline {
          margin-top: 24px;
          color: rgba(255,255,255,0.42);
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
          font-weight: 600;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(8px);
          animation: mnTaglineIn 0.52s ease forwards;
          animation-delay: 2.16s;
        }

        @keyframes mnMoFlash {
          0% {
            opacity: 0;
            filter: blur(22px);
            transform: scale(0.28);
          }
          38% {
            opacity: 0.55;
            filter: blur(13px);
            transform: scale(0.64);
          }
          72% {
            opacity: 1;
            filter: blur(2px);
            transform: scale(1.065);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: scale(1);
          }
        }

        @keyframes mnWordCenter {
          0% {
            transform: translateX(var(--initial-shift));
          }
          100% {
            transform: translateX(0);
          }
        }

        @keyframes mnRestSpread {
          0% {
            opacity: 0;
            filter: blur(14px);
            transform: translateX(0) scale(0.98);
          }
          28% {
            opacity: 0.92;
            filter: blur(8px);
            transform: translateX(0) scale(1);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateX(var(--x)) scale(1);
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

        @media (max-width: 370px) {
          .mn-word {
            --step: 0.55em;
            --initial-shift: 2.04em;
            font-size: 36px;
            letter-spacing: 0.065em;
          }

          .mn-tagline {
            margin-top: 22px;
            font-size: 10px;
            letter-spacing: 0.30em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-word,
          .mn-mo,
          .mn-rest-letter,
          .mn-tagline {
            animation: none !important;
          }

          .mn-splash {
            opacity: 1;
            visibility: visible;
          }

          .mn-word {
            transform: translateX(0);
          }

          .mn-mo,
          .mn-rest-letter,
          .mn-tagline {
            opacity: 1;
            filter: none;
            transform: none;
          }

          .mn-rest-letter:nth-child(1) { transform: translateX(0em); }
          .mn-rest-letter:nth-child(2) { transform: translateX(calc(var(--step) * 1)); }
          .mn-rest-letter:nth-child(3) { transform: translateX(calc(var(--step) * 2)); }
          .mn-rest-letter:nth-child(4) { transform: translateX(calc(var(--step) * 3)); }
          .mn-rest-letter:nth-child(5) { transform: translateX(calc(var(--step) * 4)); }
          .mn-rest-letter:nth-child(6) { transform: translateX(calc(var(--step) * 5)); }
          .mn-rest-letter:nth-child(7) { transform: translateX(calc(var(--step) * 6)); }
        }
      `}</style>

      <div className="mn-splash-inner">
        <div className="mn-logo-wrap">
          <div className="mn-word" aria-label="MONTREAUX">
            <span className="mn-mo">MO</span>
            <span className="mn-rest" aria-hidden="true">
              {restLetters.map((letter, index) => (
                <span className="mn-rest-letter" key={`${letter}-${index}`}>
                  {letter}
                </span>
              ))}
            </span>
          </div>
        </div>

        <div className="mn-tagline">FASHION</div>
      </div>
    </div>
  );
}
