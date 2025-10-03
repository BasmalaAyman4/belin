const dictionaries = {
  en: () => import('./locales/en.json').then(module => module.default),
  ar: () => import('./locales/ar.json').then(module => module.default)
}

export const getDictionary = async (locale) => {
  return dictionaries[locale]?.() ?? dictionaries.en()
}