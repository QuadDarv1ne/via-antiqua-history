import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/site/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookmarksProvider } from "@/components/site/bookmarks";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://via-antiqua-history.vercel.app'),
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
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
            </BookmarksProvider>
          </AuthProvider>
        </ThemeProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                name: 'История Древнего Пути — Интерактивный исторический лабиринт',
                description:
                  'Интерактивная историческая энциклопедия античного мира — Древняя Греция, Римская империя, Месопотамия и Кубань как единое культурное пространство. Глоссарий 50+ терминов, 18 античных городов, 44 памятника, 12 персоналий, 7 чудес света, лента времени, интерактивная карта и сравнительный анализ цивилизаций.',
                url: process.env.NEXT_PUBLIC_SITE_URL || 'https://via-antiqua-history.vercel.app',
                author: { '@type': 'Person', name: 'Дуплей Максим Игоревич' },
                inLanguage: 'ru-RU',
                educationalLevel: 'beginner',
                educationalUse: 'reference',
              },
              {
                '@type': 'WebApplication',
                name: 'История Древнего Пути',
                description:
                  'Интерактивная историческая энциклопедия античного мира — Древняя Греция, Римская империя, Месопотамия и Кубань как единое культурное пространство.',
                url: process.env.NEXT_PUBLIC_SITE_URL || 'https://via-antiqua-history.vercel.app',
                applicationCategory: 'EducationalApplication',
                operatingSystem: 'Web',
                browserRequirements: 'Requires JavaScript',
                author: { '@type': 'Person', name: 'Дуплей Максим Игоревич' },
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: (process.env.NEXT_PUBLIC_SITE_URL || 'https://via-antiqua-history.vercel.app') + '/?q={search_term_string}',
                  },
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@type': 'EducationalOrganization',
                name: 'История Древнего Пути',
                description: 'Образовательный проект об античных цивилизациях',
                url: process.env.NEXT_PUBLIC_SITE_URL || 'https://via-antiqua-history.vercel.app',
                knowsAbout: [
                  'Древняя Греция',
                  'Римская империя',
                  'Месопотамия',
                  'Боспорское царство',
                  'Античность',
                  'Классическая археология',
                ],
              },
            ],
          }),
        }}
      />
    </body>
    </html>
  );
}
