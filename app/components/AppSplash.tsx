"use client";

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
          animation: mnSplashOut 0.35s ease forwards;
          animation-delay: 3.25s;
        }

        .mn-splash-content {
          width: 100%;
          text-align: center;
          transform: translateY(2px);
        }

        .mn-logo-stage {
          position: relative;
          height: 78px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .mn-logo-word {
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
          font-size: clamp(34px, 9.2vw, 48px);
          line-height: 1;
          font-weight: 800;
          letter-spacing: 0.115em;
          color: #f7f7f7;
          will-change: transform;
          animation: mnWordShift 1.05s cubic-bezier(.22,.92,.2,1) forwards;
          animation-delay: 1.15s;
          transform: translateX(0);
        }

        .mn-mo {
          display: inline-flex;
          opacity: 0;
          transform: scale(0.42);
          filter: blur(10px);
          will-change: transform, opacity, filter;
          animation: mnMoZoom 0.95s cubic-bezier(.16,.96,.2,1) forwards;
          animation-delay: 0.08s;
        }

        .mn-rest {
          display: inline-flex;
        }

        .mn-letter {
          display: inline-block;
        }

        .mn-rest .mn-letter {
          width: 0;
          opacity: 0;
          transform: translateX(18px);
          filter: blur(7px);
          overflow: hidden;
          will-change: width, transform, opacity, filter;
          animation: mnLetterInsert 0.46s cubic-bezier(.2,.9,.18,1) forwards;
        }

        .mn-rest .mn-letter:nth-child(1) { animation-delay: 1.28s; }
        .mn-rest .mn-letter:nth-child(2) { animation-delay: 1.43s; }
        .mn-rest .mn-letter:nth-child(3) { animation-delay: 1.58s; }
        .mn-rest .mn-letter:nth-child(4) { animation-delay: 1.73s; }
        .mn-rest .mn-letter:nth-child(5) { animation-delay: 1.88s; }
        .mn-rest .mn-letter:nth-child(6) { animation-delay: 2.03s; }
        .mn-rest .mn-letter:nth-child(7) { animation-delay: 2.18s; }

        .mn-tagline {
          margin-top: 10px;
          color: rgba(255,255,255,0.48);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-size: clamp(11px, 3vw, 13px);
          line-height: 1;
          font-weight: 600;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(8px);
          animation: mnTaglineIn 0.42s ease forwards;
          animation-delay: 2.45s;
        }

        @keyframes mnMoZoom {
          0% {
            opacity: 0;
            transform: scale(0.42);
            filter: blur(10px);
          }
          62% {
            opacity: 1;
            transform: scale(1.08);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }

        @keyframes mnWordShift {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-1.8em);
          }
        }

        @keyframes mnLetterInsert {
          0% {
            width: 0;
            opacity: 0;
            transform: translateX(18px);
            filter: blur(7px);
          }
          100% {
            width: 1em;
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

        @keyframes mnSplashOut {
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
          .mn-logo-stage {
            height: 70px;
          }

          .mn-logo-word {
            font-size: 34px;
            letter-spacing: 0.095em;
          }

          .mn-tagline {
            font-size: 11px;
            letter-spacing: 0.26em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-logo-word,
          .mn-mo,
          .mn-rest .mn-letter,
          .mn-tagline {
            animation: none !important;
          }

          .mn-logo-word,
          .mn-mo,
          .mn-rest .mn-letter,
          .mn-tagline {
            opacity: 1;
            transform: none;
            filter: none;
          }

          .mn-rest .mn-letter {
            width: auto;
          }
        }
      `}</style>

      <div className="mn-splash-content">
        <div className="mn-logo-stage">
          <div className="mn-logo-word" aria-label="MONTREAUX">
            <span className="mn-mo">
              <span className="mn-letter">M</span>
              <span className="mn-letter">O</span>
            </span>

            <span className="mn-rest" aria-hidden="true">
              <span className="mn-letter">N</span>
              <span className="mn-letter">T</span>
              <span className="mn-letter">R</span>
              <span className="mn-letter">E</span>
              <span className="mn-letter">A</span>
              <span className="mn-letter">U</span>
              <span className="mn-letter">X</span>
            </span>
          </div>
        </div>

        <div className="mn-tagline">FASHION</div>
      </div>
    </div>
  );
}
