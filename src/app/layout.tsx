import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/site/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookmarksProvider } from "@/components/site/bookmarks";
import { ScrollToTop } from "@/components/site/scroll-to-top";
import { ServiceWorkerRegistration } from "@/components/site/service-worker-registration";
import { DEFAULT_SITE_URL } from "@/lib/constants";
import { FAQSchema } from "@/components/seo/faq-schema";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "История Древнего Пути",
  description: "Интерактивная историческая энциклопедия античного мира — Древняя Греция, Римская империя, Месопотамия и Кубань как единое культурное пространство.",
  url: process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web Browser",
  author: [
    { "@type": "Person", name: "Дуплей Максим Игоревич" },
    { "@type": "Person", name: "Дуплей Игорь Викторович" },
  ],
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
    default: "История Древнего Пути — Интерактивный исторический лабиринт",
    template: "%s | История Древнего Пути"
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
    "Дуплей Максим Игоревич",
    "исторический лабиринт",
    "via antiqua",
    "эллинизм",
    "Pax Romana",
  ],
  authors: [
    { name: "Дуплей Максим Игоревич" },
    { name: "Дуплей Игорь Викторович" },
  ],
  creator: "Дуплей Максим Игоревич",
  publisher: "Дуплей Максим Игоревич",
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
  applicationName: "История Древнего Пути",
  openGraph: {
    title: "История Древнего Пути — Интерактивный исторический лабиринт",
    description:
      "Интерактивная историческая энциклопедия античного мира — Греция, Рим, Междуречье и Кубань как единое культурное пространство.",
    type: "website",
    locale: "ru_RU",
    siteName: "История Древнего Пути",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "История Древнего Пути",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "История Древнего Пути — Интерактивный исторический лабиринт",
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <FAQSchema />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_LIST) }}
        />
        <a href="#main-content" className="skip-link">
          Перейти к основному содержанию
        </a>
        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>История Древнего Пути</h1>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Для полного использования сайта необходим JavaScript.
            </p>
            <p style={{ color: '#999', fontSize: '0.875rem' }}>
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
            <BookmarksProvider>
              {children}
              <ScrollToTop />
            </BookmarksProvider>
          </AuthProvider>
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
