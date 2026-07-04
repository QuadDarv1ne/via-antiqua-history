import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import "./globals.css";

const Cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

const EB = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-eb-garamond",
});
import { ThemeProvider } from "@/components/site/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookmarksProvider } from "@/components/site/bookmarks";
import { ScrollToTop } from "@/components/site/scroll-to-top";
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
  author: {
    "@type": "Person",
    name: "Дуплей Максим Игоревич",
  },
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
  authors: [{ name: "Дуплей Максим Игоревич" }],
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
  openGraph: {
    title: "История Древнего Пути — Интерактивный исторический лабиринт",
    description:
      "Интерактивная историческая энциклопедия античного мира — Греция, Рим, Междуречье и Кубань как единое культурное пространство.",
    type: "website",
    locale: "ru_RU",
    siteName: "История Древнего Пути",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "История Древнего Пути",
      },
    ],
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
      <body className={`${Cormorant.variable} ${EB.variable} font-body antialiased bg-background text-foreground`}>
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
      </body>
    </html>
  );
}
