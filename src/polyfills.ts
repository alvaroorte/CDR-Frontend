// sockjs-client espera el global de Node "global" (mismo polyfill que ticket-frontend).
(window as unknown as { global: Window }).global = window;
