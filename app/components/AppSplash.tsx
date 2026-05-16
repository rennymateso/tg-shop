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
            18px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
          animation: mnSplashExit 0.42s ease forwards;
          animation-delay: 3.05s;
        }

        .mn-splash-inner {
          width: 100%;
          text-align: center;
          transform: translateY(2px);
        }

        .mn-splash-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: 92vw;
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
          font-size: clamp(34px, 8.8vw, 44px);
          line-height: 0.95;
          font-weight: 800;
          letter-spacing: 0.035em;
          color: #f7f7f7;
          transform-origin: center center;
        }

        .mn-initial {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.08em;
          opacity: 0;
          filter: blur(10px);
          transform: scale(0.58);
          animation: mnMOIn 0.72s cubic-bezier(.16,.9,.2,1) forwards;
          will-change: transform, opacity, filter;
        }

        .mn-rest {
          display: inline-flex;
          align-items: center;
          overflow: hidden;
          max-width: 0;
          margin-left: 0;
          opacity: 0;
          filter: blur(8px);
          transform: translateX(8px);
          animation: mnLetterReveal 0.42s cubic-bezier(.18,.82,.22,1) forwards;
          will-change: max-width, margin-left, opacity, filter, transform;
        }

        .mn-rest:nth-of-type(2) { animation-delay: 0.88s; }
        .mn-rest:nth-of-type(3) { animation-delay: 1.03s; }
        .mn-rest:nth-of-type(4) { animation-delay: 1.18s; }
        .mn-rest:nth-of-type(5) { animation-delay: 1.33s; }
        .mn-rest:nth-of-type(6) { animation-delay: 1.48s; }
        .mn-rest:nth-of-type(7) { animation-delay: 1.63s; }
        .mn-rest:nth-of-type(8) { animation-delay: 1.78s; }

        .mn-tagline {
          margin-top: 20px;
          color: rgba(255,255,255,0.42);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;
          font-size: clamp(11px, 2.8vw, 13px);
          line-height: 1;
          font-weight: 600;
          letter-spacing: 0.36em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(8px);
          animation: mnTaglineIn 0.46s ease forwards;
          animation-delay: 2.08s;
        }

        @keyframes mnMOIn {
          0% {
            opacity: 0;
            filter: blur(12px);
            transform: scale(0.5);
          }
          65% {
            opacity: 1;
            filter: blur(1px);
            transform: scale(1.055);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: scale(1);
          }
        }

        @keyframes mnLetterReveal {
          0% {
            max-width: 0;
            margin-left: 0;
            opacity: 0;
            filter: blur(8px);
            transform: translateX(8px);
          }
          70% {
            opacity: 1;
            filter: blur(1px);
          }
          100% {
            max-width: 1.05em;
            margin-left: 0.08em;
            opacity: 1;
            filter: blur(0);
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

        @media (max-width: 360px) {
          .mn-splash-logo {
            font-size: 33px;
            letter-spacing: 0.025em;
          }

          .mn-tagline {
            margin-top: 18px;
            font-size: 10px;
            letter-spacing: 0.32em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-initial,
          .mn-rest,
          .mn-tagline {
            animation: none !important;
          }

          .mn-initial,
          .mn-rest,
          .mn-tagline {
            opacity: 1;
            filter: none;
            transform: none;
          }

          .mn-rest {
            max-width: 1.05em;
            margin-left: 0.08em;
          }
        }
      `}</style>

      <div className="mn-splash-inner">
        <div className="mn-splash-logo" aria-label="MONTREAUX">
          <span className="mn-initial">
            <span>M</span>
            <span>O</span>
          </span>

          {restLetters.map((letter) => (
            <span className="mn-rest" key={letter}>
              {letter}
            </span>
          ))}
        </div>

        <div className="mn-tagline">FASHION</div>
      </div>
    </div>
  );
}
