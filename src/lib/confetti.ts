const CONFETTI_CODE =
  "U2FsdGVkX1/4UaioxJ8FNVBAyN7sENIq4/7BXDsFJ1PDt/cXtpsmnU4RNTbARTXLj05w9zazFR7FurQl4yvfXo+hMCOUUrV5pWGQSQHzNubLlrwv8PFCXJdqDpMM3PhVk4sEAwUUwFFnCA9zOZ2ZcKHIDtx4oYOc8kS4n1E+1W2A0Ul52Pm1pKtHdXwZNJLSBrZV008QtO3KuNkjH7/4dGe1i1gOJEsfwx/0u1gxp41TDw18cECViHq3h9iPcrnAdyZVxGnmIeUCDLKC+FFH2j/nUufTH/EcJnIkdRmdW3dFkL1a6HXTmiGxnGEQ+88TXzGVS9UNFk27YBX95kqVymW/YhEdkIdPMrDpYoTl7hpt6WxIokMvlKmnNPZCwWyFKqM/Iw0E/9T0PkXMrFudrRmSFfcRJoPeMZI6twSbOpEw8wNQQrhAEr0xIlzp7cFJhRl+Vw0EuWFVx+pSe2ukeFCnK43e0w5JRi1oYTMyJ2P7KnUk6OjwrPoR5wghl7uOyLlNpIMoLZy5fcEBLf8Ek79kMtKyP1h4Cw47xQhEGebAD/PCek9lRRL6y/ReJqLuwg/JBPSDxh3+E/s+5TQjdflKqunWk08Zx4QIKT+VALMdgyWbi7TCKOrgsAAyu+IQXggcYjD4syLeJi+qLpgniGPA8rz69aT9UllATmfjgAH61/oD5Nyo57vGitW4tbhlTU55rfLLhaRUXMZb8bEagx/P4BwDGWOG/Lp+J3hI80ApUS9IxSdxoTKYV4uW/x9Xql8wD7VNZaWn49nlVMq71g==";

const SCRIPT_SRC = "https://run.confettipage.com/here.js";

let loadPromise: Promise<void> | null = null;

function loadConfettiScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.setAttribute("data-confetticode", CONFETTI_CODE);
    s.onload = () => resolve();
    s.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load confetti script"));
    };
    document.body.appendChild(s);
  });
  return loadPromise;
}

export function fireConfetti() {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    confetti?: () => void;
    startConfetti?: () => void;
  };
  const trigger = () => {
    if (typeof w.startConfetti === "function") w.startConfetti();
    else if (typeof w.confetti === "function") w.confetti();
  };
  loadConfettiScript()
    .then(() => {
      // Script may auto-run on load; if a global trigger exists, call it.
      setTimeout(trigger, 50);
    })
    .catch(() => {
      // swallow — confetti is non-critical
    });
}
