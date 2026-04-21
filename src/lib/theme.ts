export function initSystemTheme(): void {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  document.documentElement.classList.toggle("dark", mql.matches);
  mql.addEventListener("change", (e) => {
    document.documentElement.classList.toggle("dark", e.matches);
  });
}
