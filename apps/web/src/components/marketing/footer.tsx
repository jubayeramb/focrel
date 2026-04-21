import Link from "next/link";
import { productName } from "@focrel/brand";
import { Wordmark } from "./wordmark";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 text-foreground">
            <Wordmark className="h-6 w-auto" />
            <span className="text-sm font-semibold tracking-tight">{productName}</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Context-switching focus app for macOS. Private, local-first, and free
            during beta.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:gap-12 md:grid-cols-3">
          <FooterColumn
            heading="Product"
            links={[
              { href: "#features", label: "Features" },
              { href: "#how-it-works", label: "How it works" },
              { href: "#download", label: "Download" },
              { href: "#faq", label: "FAQ" },
            ]}
          />
          <FooterColumn
            heading="Company"
            links={[
              { href: "/blog", label: "Blog" },
              { href: "/changelog", label: "Changelog" },
              { href: "/privacy", label: "Privacy" },
            ]}
          />
          <FooterColumn
            heading="Connect"
            links={[
              { href: "https://github.com", label: "GitHub", external: true },
              { href: "mailto:hello@focrel.app", label: "Email" },
            ]}
          />
        </div>
      </div>

      <div className="border-t border-border/60 py-5">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 text-xs text-muted-foreground">
          <span>
            © {year} {productName}
          </span>
          <span>Made for deep work</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: Array<{ href: string; label: string; external?: boolean }>;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
        {heading}
      </div>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="transition-colors hover:text-foreground"
              {...(link.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
