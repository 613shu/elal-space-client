const SITE = 'אל על חלל'

export function pageHead(title?: string, description?: string) {
  const full = title ? `${title} · ${SITE}` : `${SITE} · מסעות בין־כוכביים`
  return {
    meta: [
      { title: full },
      ...(description ? [{ name: 'description', content: description }] : []),
      { property: 'og:title', content: full },
      ...(description ? [{ property: 'og:description', content: description }] : []),
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'he_IL' },
      { name: 'theme-color', content: '#040813' },
    ],
  }
}
