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
          animation: mnSplashExit 0.42s ease forwards;
          animation-delay: 3.18s;
        }

        .mn-splash-inner {
          width: 100%;
          max-width: 390px;
          text-align: center;
          transform: translateY(8px);
        }

        .mn-logo-stage {
          position: relative;
          width: min(86vw, 342px);
          height: 70px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mn-logo {
          position: relative;
          height: 70px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;
          font-size: clamp(36px, 9.2vw, 48px);
          line-height: 1;
          font-weight: 800;
          letter-spacing: 0.13em;
          white-space: nowrap;
          will-change: transform, opacity, filter;
        }

        .mn-mo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.13em;
          transform-origin: center;
          opacity: 0;
          filter: blur(14px);
          transform: scale(0.58);
          animation: mnMoFlash 0.88s cubic-bezier(.16, 1, .3, 1) forwards;
        }

        .mn-rest {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.13em;
          max-width: 0;
          overflow: hidden;
          opacity: 0;
          transform: translateX(-0.06em);
          animation: mnRestReveal 1.05s cubic-bezier(.16, 1, .3, 1) forwards;
          animation-delay: 1.02s;
        }

        .mn-rest span {
          display: inline-block;
          opacity: 0;
          filter: blur(9px);
          transform: translateX(-0.26em) scale(0.98);
          animation: mnRestLetters 0.95s cubic-bezier(.16, 1, .3, 1) forwards;
          animation-delay: 1.08s;
        }

        .mn-tagline {
          margin-top: 20px;
          color: rgba(255,255,255,0.34);
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
          font-weight: 600;
          letter-spacing: 0.42em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(8px);
          animation: mnTaglineIn 0.58s ease forwards;
          animation-delay: 2.15s;
        }

        @keyframes mnMoFlash {
          0% {
            opacity: 0;
            filter: blur(16px);
            transform: scale(0.48);
          }
          48% {
            opacity: 1;
            filter: blur(2px);
            transform: scale(1.06);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: scale(1);
          }
        }

        @keyframes mnRestReveal {
          0% {
            max-width: 0;
            opacity: 0;
            transform: translateX(-0.06em);
          }
          18% {
            opacity: 1;
          }
          100% {
            max-width: 7.4em;
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes mnRestLetters {
          0% {
            opacity: 0;
            filter: blur(10px);
            transform: translateX(-0.32em) scale(0.98);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateX(0) scale(1);
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
          .mn-logo-stage {
            width: min(88vw, 320px);
            height: 64px;
          }

          .mn-logo {
            height: 64px;
            font-size: 34px;
            letter-spacing: 0.115em;
          }

          .mn-mo,
          .mn-rest {
            gap: 0.115em;
          }

          .mn-tagline {
            font-size: 11px;
            letter-spacing: 0.36em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-mo,
          .mn-rest,
          .mn-rest span,
          .mn-tagline {
            animation: none !important;
          }

          .mn-mo,
          .mn-rest,
          .mn-rest span,
          .mn-tagline {
            opacity: 1;
            filter: none;
            transform: none;
          }

          .mn-rest {
            max-width: none;
          }
        }
      `}</style>

      <div className="mn-splash-inner">
        <div className="mn-logo-stage">
          <div className="mn-logo" aria-label="MONTREAUX">
            <span className="mn-mo">
              <span>M</span>
              <span>O</span>
            </span>

            <span className="mn-rest" aria-hidden="true">
              <span>N</span>
              <span>T</span>
              <span>R</span>
              <span>E</span>
              <span>A</span>
              <span>U</span>
              <span>X</span>
            </span>
          </div>
        </div>

        <div className="mn-tagline">FASHION</div>
      </div>
    </div>
  );
}
