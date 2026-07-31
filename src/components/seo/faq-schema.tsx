import { FAQ_DATA } from '@/lib/history-data'

function safeJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003C')
}

export function FAQSchema() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }}
    />
  )
}
