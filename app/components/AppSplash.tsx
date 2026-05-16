"use client";

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
          animation: mnSplashExit 0.38s ease forwards;
          animation-delay: 3.15s;
        }

        .mn-splash-stage {
          position: relative;
          width: min(100%, 420px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transform: translateY(2px);
        }

        .mn-splash-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: calc(100vw - 44px);
          white-space: nowrap;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          font-size: clamp(34px, 9vw, 46px);
          line-height: 0.95;
          font-weight: 800;
          letter-spacing: 0.105em;
          transform-origin: center center;
        }

        .mn-logo-mo {
          display: inline-block;
          opacity: 0;
          filter: blur(16px);
          transform: scale(0.56);
          animation: mnMoAppear 0.92s cubic-bezier(.16,.88,.2,1) forwards;
          will-change: opacity, transform, filter;
        }

        .mn-logo-rest {
          display: inline-block;
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          filter: blur(12px);
          transform: translateX(-8px);
          animation: mnRestReveal 1.36s cubic-bezier(.18,.78,.2,1) forwards;
          animation-delay: 0.94s;
          will-change: max-width, opacity, transform, filter;
        }

        .mn-splash-tagline {
          margin-top: 21px;
          color: rgba(255,255,255,0.46);
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
          filter: blur(5px);
          animation: mnTaglineIn 0.62s ease forwards;
          animation-delay: 2.1s;
        }

        .mn-splash-glow {
          position: absolute;
          width: min(260px, 62vw);
          height: min(260px, 62vw);
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,255,255,.105), transparent 62%);
          opacity: 0;
          transform: scale(.55);
          animation: mnSoftGlow 1.15s ease forwards;
          pointer-events: none;
        }

        @keyframes mnMoAppear {
          0% {
            opacity: 0;
            filter: blur(16px);
            transform: scale(0.56);
          }
          54% {
            opacity: 1;
            filter: blur(2.8px);
            transform: scale(1.045);
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
            filter: blur(12px);
            transform: translateX(-8px);
          }
          32% {
            opacity: 0.62;
            filter: blur(7px);
          }
          68% {
            opacity: 1;
            filter: blur(1.8px);
          }
          100% {
            max-width: 330px;
            opacity: 1;
            filter: blur(0);
            transform: translateX(0);
          }
        }

        @keyframes mnTaglineIn {
          from {
            opacity: 0;
            transform: translateY(8px);
            filter: blur(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes mnSoftGlow {
          0% {
            opacity: 0;
            transform: scale(.55);
          }
          46% {
            opacity: .78;
            transform: scale(1);
          }
          100% {
            opacity: .18;
            transform: scale(1.28);
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

        @media (max-width: 380px) {
          .mn-splash-logo {
            font-size: clamp(31px, 8.4vw, 38px);
            letter-spacing: 0.09em;
          }

          .mn-logo-rest {
            animation-name: mnRestRevealSmall;
          }

          .mn-splash-tagline {
            font-size: 10px;
            letter-spacing: 0.3em;
          }
        }

        @keyframes mnRestRevealSmall {
          0% {
            max-width: 0;
            opacity: 0;
            filter: blur(12px);
            transform: translateX(-8px);
          }
          32% {
            opacity: 0.62;
            filter: blur(7px);
          }
          68% {
            opacity: 1;
            filter: blur(1.8px);
          }
          100% {
            max-width: 275px;
            opacity: 1;
            filter: blur(0);
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mn-splash,
          .mn-splash-glow,
          .mn-logo-mo,
          .mn-logo-rest,
          .mn-splash-tagline {
            animation: none !important;
          }

          .mn-logo-mo,
          .mn-logo-rest,
          .mn-splash-tagline {
            opacity: 1;
            filter: none;
            transform: none;
          }

          .mn-logo-rest {
            max-width: 330px;
          }
        }
      `}</style>

      <div className="mn-splash-stage">
        <div className="mn-splash-glow" />
        <div className="mn-splash-logo" aria-label="MONTREAUX">
          <span className="mn-logo-mo">MO</span>
          <span className="mn-logo-rest">NTREAUX</span>
        </div>
        <div className="mn-splash-tagline">FASHION</div>
      </div>
    </div>
  );
}
