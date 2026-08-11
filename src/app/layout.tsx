import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/site/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { BookmarksProvider } from "@/components/site/bookmarks";
import { ScrollToTop } from "@/components/site/scroll-to-top";
import { ServiceWorkerRegistration } from "@/components/site/service-worker-registration";
import { DEFAULT_SITE_URL, SITE_FULL_NAME, AUTHOR_NAME } from "@/lib/constants";
import { FAQSchema } from "@/components/seo/faq-schema";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_FULL_NAME,
  description: "Интерактивная историческая энциклопедия античного мира — Древняя Греция, Римская империя, Месопотамия и Кубань как единое культурное пространство.",
  url: process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web Browser",
  author: { "@type": "Person", name: AUTHOR_NAME },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "RUB",
  },
  featureList: [
    "18 городов античности",
    "32+ памятников архитектуры",
    "12 исторических персоналий",
    "7 чудес света",
    "Интерактивная лента времени",
    "Интерактивная карта",
    "Квиз на 20 вопросов",
    "Глоссарий терминов",
  ],
};

const BREADCRUMB_LIST = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Главная", "item": process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL),
  title: {
    default: `${SITE_FULL_NAME} — Интерактивный исторический лабиринт`,
    template: `%s | ${SITE_FULL_NAME}`
  },
  description:
    "Интерактивная историческая энциклопедия античного мира — Древняя Греция, Римская империя, Месопотамия и Кубань как единое культурное пространство. 18 городов, 32+ памятников, 12 персоналий, 7 чудес света.",
  keywords: [
    "Древняя Греция",
    "Римская империя",
    "Месопотамия",
    "Кубань",
    "Боспорское царство",
    "Акрополь",
    "Парфенон",
    "история античности",
    "античные цивилизации",
    "Чудеса света",
    AUTHOR_NAME,
    "исторический лабиринт",
    "via antiqua",
    "эллинизм",
    "Pax Romana",
  ],
  authors: [{ name: AUTHOR_NAME }],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  applicationName: SITE_FULL_NAME,
  openGraph: {
    title: `${SITE_FULL_NAME} — Интерактивный исторический лабиринт`,
    description:
      "Интерактивная историческая энциклопедия античного мира — Греция, Рим, Междуречье и Кубань как единое культурное пространство.",
    type: "website",
    locale: "ru_RU",
    siteName: SITE_FULL_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: SITE_FULL_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_FULL_NAME} — Интерактивный исторический лабиринт`,
    description:
      "Интерактивная энциклопедия античного мира — 18 городов, 32+ памятников, 12 персоналий, 7 чудес света.",
    images: ["/og-image.png"],
    creator: "@QuadDarv1ne",
    site: "@QuadDarv1ne",
  },
  category: "education",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4EE" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1612" },
  ],
};

function safeJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003C")
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="font-body antialiased bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(JSON_LD) }}
        />
        <FAQSchema />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(BREADCRUMB_LIST) }}
        />
        <a href="#main-content" className="skip-link">
          Перейти к основному содержанию
        </a>
        <noscript>
          <div className="p-8 text-center font-sans">
            <h1 className="text-2xl mb-4">{SITE_FULL_NAME}</h1>
            <p className="text-gray-500 mb-4">
              Для полного использования сайта необходим JavaScript.
            </p>
            <p className="text-gray-400 text-sm">
              Интерактивная историческая энциклопедия античного мира — Древняя Греция, Римская империя, Месопотамия и Кубань.
            </p>
          </div>
        </noscript>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SubscriptionProvider>
              <BookmarksProvider>
                {children}
                <ScrollToTop />
              </BookmarksProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
