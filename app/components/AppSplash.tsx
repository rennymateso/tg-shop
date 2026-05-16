"use client";

const tailLetters = ["O", "N", "T", "R", "E", "A", "U", "X"];

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
            22px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
          animation: mnSplashExit 0.45s ease forwards;
          animation-delay: 3.15s;
        }

        .mn-splash-inner {
          width: 100%;
          max-width: 430px;
          text-align: center;
          transform: translateY(6px);
        }

        .mn-logo-wrap {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .mn-logo {
          display: inline-flex;
          align-items: baseline;
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
          font-size: clamp(38px, 10.2vw, 54px);
          line-height: 0.95;
          font-weight: 800;
          letter-spacing: 0.085em;
          transform-origin: center center;
        }

        .mn-start-letter {
          display: inline-block;
          opacity: 0;
          transform: scale(0.62);
          animation: mnFirstLetterIn 0.95s cubic-bezier(.16,.96,.24,1) forwards;
          animation-delay: 0.08s;
          will-change: transform, opacity;
        }

        .mn-tail {
          display: inline-flex;
          align-items: baseline;
          overflow: hidden;
          max-width: 0;
          opacity: 0;
          transform: translateX(-4px);
          animation: mnTailOpen 1.35s cubic-bezier(.18,.82,.22,1) forwards;
          animation-delay: 1.05s;
          will-change: max-width, opacity, transform;
        }

        .mn-tail-inner {
          display: inline-flex;
          align-items: baseline;
          gap: clamp(4px, 1vw, 7px);
          transform: translateX(-26px);
          opacity: 0;
          animation: mnTailSlide 1.35s cubic-bezier(.18,.82,.22,1) forwards;
          animation-delay: 1.05s;
          will-change: transform, opacity;
        }

        .mn-tail-letter {
          display: inline-block;
        }

        .mn-tagline {
          margin-top: 22px;
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
          letter-spacing: 0.32em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(8px);
          animation: mnTaglineIn 0.55s ease forwards;
          animation-delay: 2.25s;
        }

        @keyframes mnFirstLetterIn {
          0% {
            opacity: 0;
            transform: scale(0.62);
          }
          58% {
            opacity: 1;
            transform: scale(1.08);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes mnTailOpen {
          0% {
            max-width: 0;
            opacity: 0;
            transform: translateX(-4px);
          }
          18% {
            opacity: 1;
          }
          100% {
            max-width: min(330px, 78vw);
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes mnTailSlide {
          0% {
            opacity: 0;
            transform: translateX(-26px);
          }
          22% {
            opacity: 1;
          }
          100% {
            opacity: 1;
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

        @media (max-width: 370px) {
          .mn-logo {
            font-size: 37px;
            letter-spacing: 0.07em;
          }

          .mn-tail-inner {
            gap: 4px;
          }

          .mn-tagline {
            font-size: 11px;
            letter-spacing: 0.26em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-start-letter,
          .mn-tail,
          .mn-tail-inner,
          .mn-tagline {
            animation: none !important;
          }

          .mn-start-letter,
          .mn-tail,
          .mn-tail-inner,
          .mn-tagline {
            opacity: 1;
            transform: none;
          }

          .mn-tail {
            max-width: none;
            overflow: visible;
          }
        }
      `}</style>

      <div className="mn-splash-inner">
        <div className="mn-logo-wrap">
          <div className="mn-logo" aria-label="MONTREAUX">
            <span className="mn-start-letter">M</span>

            <span className="mn-tail" aria-hidden="true">
              <span className="mn-tail-inner">
                {tailLetters.map((letter, index) => (
                  <span className="mn-tail-letter" key={`${letter}-${index}`}>
                    {letter}
                  </span>
                ))}
              </span>
            </span>
          </div>
        </div>

        <div className="mn-tagline">FASHION</div>
      </div>
    </div>
  );
}
