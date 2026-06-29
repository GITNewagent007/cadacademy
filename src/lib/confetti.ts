const CONFETTI_CODE =
  "U2FsdGVkX1/4UaioxJ8FNVBAyN7sENIq4/7BXDsFJ1PDt/cXtpsmnU4RNTbARTXLj05w9zazFR7FurQl4yvfXo+hMCOUUrV5pWGQSQHzNubLlrwv8PFCXJdqDpMM3PhVk4sEAwUUwFFnCA9zOZ2ZcKHIDtx4oYOc8kS4n1E+1W2A0Ul52Pm1pKtHdXwZNJLSBrZV008QtO3KuNkjH7/4dGe1i1gOJEsfwx/0u1gxp41TDw18cECViHq3h9iPcrnAdyZVxGnmIeUCDLKC+FFH2j/nUufTH/EcJnIkdRmdW3dFkL1a6HXTmiGxnGEQ+88TXzGVS9UNFk27YBX95kqVymW/YhEdkIdPMrDpYoTl7hpt6WxIokMvlKmnNPZCwWyFKqM/Iw0E/9T0PkXMrFudrRmSFfcRJoPeMZI6twSbOpEw8wNQQrhAEr0xIlzp7cFJhRl+Vw0EuWFVx+pSe2ukeFCnK43e0w5JRi1oYTMyJ2P7KnUk6OjwrPoR5wghl7uOyLlNpIMoLZy5fcEBLf8Ek79kMtKyP1h4Cw47xQhEGebAD/PCek9lRRL6y/ReJqLuwg/JBPSDxh3+E/s+5TQjdflKqunWk08Zx4QIKT+VALMdgyWbi7TCKOrgsAAyu+IQXggcYjD4syLeJi+qLpgniGPA8rz69aT9UllATmfjgAH61/oD5Nyo57vGitW4tbhlTU55rfLLhaRUXMZb8bEagx/P4BwDGWOG/Lp+J3hI80ApUS9IxSdxoTKYV4uW/x9Xql8wD7VNZaWn49nlVMq71g==";

const SCRIPT_SRC = "https://run.confettipage.com/here.js";

export function fireConfetti() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // The confettipage script self-executes on load. To fire again on each
  // call, remove any previous tag and append a fresh one.
  document
    .querySelectorAll<HTMLScriptElement>(`script[src^="${SCRIPT_SRC}"]`)
    .forEach((el) => el.remove());

  const s = document.createElement("script");
  s.src = SCRIPT_SRC;
  s.async = true;
  s.setAttribute("data-confetticode", CONFETTI_CODE);
  document.body.appendChild(s);
}
