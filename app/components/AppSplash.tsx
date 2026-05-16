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
            24px
            calc(env(safe-area-inset-bottom, 0px) + 24px);
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
          animation: mnSplashFadeOut 0.34s ease forwards;
          animation-delay: 3.16s;
        }

        .mn-splash-inner {
          width: 100%;
          max-width: 420px;
          text-align: center;
          transform: translateY(2px);
        }

        .mn-logo-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: calc(100vw - 36px);
          overflow: visible;
        }

        .mn-logo {
          display: inline-flex;
          align-items: baseline;
          justify-content: flex-start;
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
          font-size: clamp(36px, 10.2vw, 50px);
          line-height: 0.95;
          font-weight: 800;
          letter-spacing: 0.075em;
          transform: translateX(39%);
          animation: mnLogoSettle 1.18s cubic-bezier(.22, .85, .24, 1) forwards;
          animation-delay: 0.72s;
          will-change: transform;
        }

        .mn-logo-m {
          display: inline-block;
          opacity: 0;
          transform: scale(0.62);
          animation: mnMEnter 0.72s cubic-bezier(.16, .9, .25, 1) forwards;
          will-change: transform, opacity;
        }

        .mn-logo-tail {
          display: inline-block;
          overflow: hidden;
          max-width: 0;
          opacity: 0;
          transform: translateX(-0.18em);
          animation: mnTailReveal 1.38s cubic-bezier(.2, .82, .22, 1) forwards;
          animation-delay: 0.86s;
          will-change: max-width, opacity, transform;
        }

        .mn-tagline {
          margin-top: 22px;
          color: rgba(255,255,255,0.34);
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
          letter-spacing: 0.34em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(8px);
          animation: mnTaglineIn 0.5s ease forwards;
          animation-delay: 2.12s;
        }

        @keyframes mnMEnter {
          0% {
            opacity: 0;
            transform: scale(0.62);
          }
          62% {
            opacity: 1;
            transform: scale(1.045);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes mnLogoSettle {
          0% {
            transform: translateX(39%);
          }
          100% {
            transform: translateX(0);
          }
        }

        @keyframes mnTailReveal {
          0% {
            max-width: 0;
            opacity: 0;
            transform: translateX(-0.18em);
          }
          18% {
            opacity: 1;
          }
          100% {
            max-width: 8.2em;
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
          .mn-logo {
            font-size: 34px;
            letter-spacing: 0.062em;
            transform: translateX(38%);
          }

          @keyframes mnLogoSettle {
            0% {
              transform: translateX(38%);
            }
            100% {
              transform: translateX(0);
            }
          }

          .mn-tagline {
            font-size: 10px;
            letter-spacing: 0.3em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-logo,
          .mn-logo-m,
          .mn-logo-tail,
          .mn-tagline {
            animation: none !important;
          }

          .mn-logo {
            transform: translateX(0);
          }

          .mn-logo-m,
          .mn-logo-tail,
          .mn-tagline {
            opacity: 1;
            transform: none;
          }

          .mn-logo-tail {
            max-width: 8.2em;
          }
        }
      `}</style>

      <div className="mn-splash-inner">
        <div className="mn-logo-wrap">
          <div className="mn-logo" aria-label="MONTREAUX">
            <span className="mn-logo-m">M</span>
            <span className="mn-logo-tail">ONTREAUX</span>
          </div>
        </div>

        <div className="mn-tagline">FASHION</div>
      </div>
    </div>
  );
}
