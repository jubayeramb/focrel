/**
 * HSL tuples (`h s% l%`) compatible with the `hsl(var(--token))` pattern
 * shared across both apps. Mirrors tokens.css so tools that need JS access
 * (JSON-LD, OG image generation, storybook-style surfaces) can import them
 * without parsing CSS.
 */
export const brandColorsLight = {
  background: "0 0% 100%",
  foreground: "240 10% 3.9%",
  card: "0 0% 100%",
  cardForeground: "240 10% 3.9%",
  popover: "0 0% 100%",
  popoverForeground: "240 10% 3.9%",
  primary: "240 5.9% 10%",
  primaryForeground: "0 0% 98%",
  secondary: "240 4.8% 95.9%",
  secondaryForeground: "240 5.9% 10%",
  muted: "240 4.8% 95.9%",
  mutedForeground: "240 3.8% 46.1%",
  accent: "240 4.8% 95.9%",
  accentForeground: "240 5.9% 10%",
  destructive: "0 84.2% 60.2%",
  destructiveForeground: "0 0% 98%",
  border: "240 5.9% 90%",
  input: "240 5.9% 88%",
  ring: "240 5.9% 10%",
  sidebar: "240 5% 97%",
} as const;

export const brandColorsDark = {
  background: "240 10% 3.9%",
  foreground: "0 0% 98%",
  card: "240 6% 7%",
  cardForeground: "0 0% 98%",
  popover: "240 6% 7%",
  popoverForeground: "0 0% 98%",
  primary: "0 0% 98%",
  primaryForeground: "240 5.9% 10%",
  secondary: "240 4% 14%",
  secondaryForeground: "0 0% 98%",
  muted: "240 4% 14%",
  mutedForeground: "240 5% 70%",
  accent: "240 4% 16%",
  accentForeground: "0 0% 98%",
  destructive: "0 62.8% 45%",
  destructiveForeground: "0 0% 98%",
  border: "240 4% 18%",
  input: "240 4% 20%",
  ring: "240 4.9% 83.9%",
  sidebar: "240 8% 5%",
} as const;

export const brandRadius = "0.625rem";

export const brandFontStack = {
  sans: [
    "-apple-system",
    "BlinkMacSystemFont",
    "SF Pro Text",
    "SF Pro Display",
    "Inter",
    "system-ui",
    "sans-serif",
  ],
  display: [
    "-apple-system",
    "BlinkMacSystemFont",
    "SF Pro Display",
    "Inter",
    "system-ui",
    "sans-serif",
  ],
} as const;
