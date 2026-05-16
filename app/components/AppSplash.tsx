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
            20px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
          animation: mnSplashExit 0.42s ease forwards;
          animation-delay: 3.05s;
        }

        .mn-splash-inner {
          position: relative;
          width: 100%;
          max-width: 100vw;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(6px);
        }

        .mn-logo-wrap {
          position: absolute;
          left: 50%;
          top: 50%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: clamp(8px, 2.5vw, 16px);
          white-space: nowrap;
          transform-origin: left center;
          transform: translate(-50%, -50%) scale(1);
          animation: mnLogoShift 1.35s cubic-bezier(.18,.82,.24,1) forwards;
          animation-delay: 0.92s;
        }

        .mn-logo-mo,
        .mn-logo-rest {
          display: inline-flex;
          align-items: center;
          gap: clamp(8px, 2.5vw, 16px);
        }

        .mn-letter {
          display: inline-block;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-size: clamp(38px, 10.4vw, 54px);
          line-height: .92;
          font-weight: 800;
          letter-spacing: .02em;
          color: #f7f7f7;
        }

        .mn-logo-mo {
          animation: mnMoFromFar 0.82s cubic-bezier(.16,.92,.24,1) forwards;
          transform-origin: center;
          opacity: 0;
          filter: blur(12px);
          transform: scale(.34);
        }

        .mn-rest-letter {
          opacity: 0;
          filter: blur(8px);
          transform: translateX(18px);
          animation: mnRestIn 0.48s cubic-bezier(.18,.86,.22,1) forwards;
        }

        .mn-rest-letter:nth-child(1) { animation-delay: 1.05s; }
        .mn-rest-letter:nth-child(2) { animation-delay: 1.19s; }
        .mn-rest-letter:nth-child(3) { animation-delay: 1.33s; }
        .mn-rest-letter:nth-child(4) { animation-delay: 1.47s; }
        .mn-rest-letter:nth-child(5) { animation-delay: 1.61s; }
        .mn-rest-letter:nth-child(6) { animation-delay: 1.75s; }
        .mn-rest-letter:nth-child(7) { animation-delay: 1.89s; }

        .mn-tagline {
          position: absolute;
          left: 50%;
          top: calc(50% + 58px);
          transform: translateX(-50%) translateY(10px);
          color: rgba(255,255,255,.42);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-size: 12px;
          line-height: 1;
          font-weight: 600;
          letter-spacing: .34em;
          text-transform: uppercase;
          opacity: 0;
          animation: mnTaglineIn .45s ease forwards;
          animation-delay: 2.12s;
        }

        @keyframes mnMoFromFar {
          0% {
            opacity: 0;
            filter: blur(12px);
            transform: scale(.34);
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

        @keyframes mnLogoShift {
          0% {
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            transform: translate(-50%, -50%) translateX(calc(-1 * min(30vw, 132px))) scale(.88);
          }
        }

        @keyframes mnRestIn {
          0% {
            opacity: 0;
            filter: blur(8px);
            transform: translateX(18px);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateX(0);
          }
        }

        @keyframes mnTaglineIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
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

        @media (max-width: 390px) {
          .mn-logo-wrap {
            gap: 8px;
          }

          .mn-logo-mo,
          .mn-logo-rest {
            gap: 8px;
          }

          .mn-letter {
            font-size: 37px;
          }

          .mn-tagline {
            top: calc(50% + 50px);
            font-size: 11px;
            letter-spacing: .3em;
          }

          @keyframes mnLogoShift {
            0% {
              transform: translate(-50%, -50%) scale(1);
            }
            100% {
              transform: translate(-50%, -50%) translateX(-112px) scale(.84);
            }
          }
        }

        @media (max-width: 340px) {
          .mn-letter {
            font-size: 33px;
          }

          .mn-logo-wrap,
          .mn-logo-mo,
          .mn-logo-rest {
            gap: 7px;
          }

          @keyframes mnLogoShift {
            0% {
              transform: translate(-50%, -50%) scale(1);
            }
            100% {
              transform: translate(-50%, -50%) translateX(-96px) scale(.82);
            }
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-logo-wrap,
          .mn-logo-mo,
          .mn-rest-letter,
          .mn-tagline {
            animation: none !important;
          }

          .mn-logo-wrap {
            transform: translate(-50%, -50%) translateX(-112px) scale(.84);
          }

          .mn-logo-mo,
          .mn-rest-letter,
          .mn-tagline {
            opacity: 1;
            filter: none;
            transform: none;
          }

          .mn-tagline {
            transform: translateX(-50%);
          }
        }
      `}</style>

      <div className="mn-splash-inner">
        <div className="mn-logo-wrap" aria-label="MONTREAUX">
          <span className="mn-logo-mo" aria-hidden="true">
            <span className="mn-letter">M</span>
            <span className="mn-letter">O</span>
          </span>

          <span className="mn-logo-rest" aria-hidden="true">
            {restLetters.map((letter, index) => (
              <span className="mn-letter mn-rest-letter" key={`${letter}-${index}`}>
                {letter}
              </span>
            ))}
          </span>
        </div>

        <div className="mn-tagline">FASHION</div>
      </div>
    </div>
  );
}
