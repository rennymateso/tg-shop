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
          animation: mnSplashFadeOut 0.42s ease forwards;
          animation-delay: 3.32s;
        }

        .mn-splash-inner {
          width: 100%;
          max-width: 420px;
          text-align: center;
          transform: translateY(2px);
        }

        .mn-logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
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
          font-size: clamp(35px, 9.7vw, 48px);
          line-height: 0.95;
          font-weight: 780;
          letter-spacing: 0.072em;
          transform: translateX(38%);
          animation: mnLogoSettle 1.62s cubic-bezier(.18, .78, .18, 1) forwards;
          animation-delay: 0.82s;
          will-change: transform;
        }

        .mn-logo-m {
          display: inline-block;
          opacity: 0;
          transform: scale(0.72);
          animation: mnMEnter 0.82s cubic-bezier(.17, .84, .25, 1) forwards;
          will-change: transform, opacity;
        }

        .mn-logo-tail {
          display: inline-block;
          opacity: 0;
          clip-path: inset(0 100% 0 0);
          transform: translateX(-0.06em);
          animation: mnTailReveal 1.62s cubic-bezier(.18, .78, .18, 1) forwards;
          animation-delay: 0.82s;
          will-change: clip-path, opacity, transform;
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
          font-weight: 560;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(7px);
          animation: mnTaglineIn 0.58s ease forwards;
          animation-delay: 2.35s;
        }

        @keyframes mnMEnter {
          0% {
            opacity: 0;
            transform: scale(0.72);
          }
          58% {
            opacity: 1;
            transform: scale(1.025);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes mnLogoSettle {
          0% {
            transform: translateX(38%);
          }
          100% {
            transform: translateX(0);
          }
        }

        @keyframes mnTailReveal {
          0% {
            opacity: 0;
            clip-path: inset(0 100% 0 0);
            transform: translateX(-0.06em);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            clip-path: inset(0 0 0 0);
            transform: translateX(0);
          }
        }

        @keyframes mnTaglineIn {
          from {
            opacity: 0;
            transform: translateY(7px);
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
            font-size: 33px;
            letter-spacing: 0.062em;
            transform: translateX(37%);
          }

          @keyframes mnLogoSettle {
            0% {
              transform: translateX(37%);
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
            clip-path: inset(0 0 0 0);
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
