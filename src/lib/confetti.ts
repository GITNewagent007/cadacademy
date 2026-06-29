const CONFETTI_CODE =
  "U2FsdGVkX1/4UaioxJ8FNVBAyN7sENIq4/7BXDsFJ1PDt/cXtpsmnU4RNTbARTXLj05w9zazFR7FurQl4yvfXo+hMCOUUrV5pWGQSQHzNubLlrwv8PFCXJdqDpMM3PhVk4sEAwUUwFFnCA9zOZ2ZcKHIDtx4oYOc8kS4n1E+1W2A0Ul52Pm1pKtHdXwZNJLSBrZV008QtO3KuNkjH7/4dGe1i1gOJEsfwx/0u1gxp41TDw18cECViHq3h9iPcrnAdyZVxGnmIeUCDLKC+FFH2j/nUufTH/EcJnIkdRmdW3dFkL1a6HXTmiGxnGEQ+88TXzGVS9UNFk27YBX95kqVymW/YhEdkIdPMrDpYoTl7hpt6WxIokMvlKmnNPZCwWyFKqM/Iw0E/9T0PkXMrFudrRmSFfcRJoPeMZI6twSbOpEw8wNQQrhAEr0xIlzp7cFJhRl+Vw0EuWFVx+pSe2ukeFCnK43e0w5JRi1oYTMyJ2P7KnUk6OjwrPoR5wghl7uOyLlNpIMoLZy5fcEBLf8Ek79kMtKyP1h4Cw47xQhEGebAD/PCek9lRRL6y/ReJqLuwg/JBPSDxh3+E/s+5TQjdflKqunWk08Zx4QIKT+VALMdgyWbi7TCKOrgsAAyu+IQXggcYjD4syLeJi+qLpgniGPA8rz69aT9UllATmfjgAH61/oD5Nyo57vGitW4tbhlTU55rfLLhaRUXMZb8bEagx/P4BwDGWOG/Lp+J3hI80ApUS9IxSdxoTKYV4uW/x9Xql8wD7VNZaWn49nlVMq71g==";

const SCRIPT_SRC = "https://run.confettipage.com/here.js";

function hideWatermark() {
  if (typeof document === "undefined") return;
  const kill = (root: ParentNode) => {
    root.querySelectorAll<HTMLElement>('a[href*="confettipage.com"]').forEach((a) => {
      // Hide the badge itself and any wrapping container the script placed it in.
      a.style.display = "none";
      let p: HTMLElement | null = a.parentElement;
      for (let i = 0; i < 3 && p && p !== document.body; i++) {
        const txt = (p.textContent || "").toLowerCase();
        if (txt.includes("confettipage") && txt.length < 60) {
          p.style.display = "none";
        }
        p = p.parentElement;
      }
    });
  };
  kill(document);
  const obs = new MutationObserver(() => kill(document));
  obs.observe(document.body, { childList: true, subtree: true });
  // Stop observing after a few seconds — the badge mounts shortly after script load.
  setTimeout(() => obs.disconnect(), 8000);
}

let watermarkHookInstalled = false;

export function fireConfetti() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (!watermarkHookInstalled) {
    watermarkHookInstalled = true;
    hideWatermark();
  }

  // The confettipage script self-executes on load. Re-inject to fire each time.
  document
    .querySelectorAll<HTMLScriptElement>(`script[src^="${SCRIPT_SRC}"]`)
    .forEach((el) => el.remove());

  // Also re-run the watermark scrubber for this burst.
  hideWatermark();

  const s = document.createElement("script");
  s.src = SCRIPT_SRC;
  s.async = true;
  s.setAttribute("data-confetticode", CONFETTI_CODE);
  document.body.appendChild(s);
}
