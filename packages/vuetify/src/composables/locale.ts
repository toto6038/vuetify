// Utilities
import { computed, inject, provide, ref } from 'vue'

import enUS from '@/locale/en'

// Types
import type { InjectionKey, Ref } from 'vue'
import { getObjectValueByPath } from '@/util'
import { consoleError, consoleWarn } from '@/util/console'

export interface LocaleProvide {
  locales: Ref<Record<string, Locale>>
  current: Ref<string>
  fallback: Ref<string>
  translate: (key: string, ...params: unknown[]) => string
}

// TODO: explicit definition of locale?
export interface Locale {
  [key: string]: Locale | string
}

export interface LocaleOptions {
  defaultLocale?: string
  fallbackLocale?: string
  locales?: Record<string, Locale>
  translate?: () => void
}

export const VuetifyLocaleSymbol: InjectionKey<LocaleProvide> = Symbol.for('vuetify:locale')

const LANG_PREFIX = '$vuetify.'

const replace = (str: string, params: unknown[]) => {
  return str.replace(/\{(\d+)\}/g, (match: string, index: string) => {
    /* istanbul ignore next */
    return String(params[+index])
  })
}

const createTranslateFunction = (current: Ref<string>, fallback: Ref<string>, locales: Ref<Record<string, Locale>>) => {
  return (key: string, ...params: unknown[]) => {
    if (!key.startsWith(LANG_PREFIX)) {
      return replace(key, params)
    }

    const shortKey = key.replace(LANG_PREFIX, '')
    const currentLocale = locales.value[current.value]
    const fallbackLocale = locales.value[fallback.value]

    let str: string = getObjectValueByPath(currentLocale, shortKey, null)

    if (!str) {
      consoleWarn(`Translation key "${shortKey}" not found in "${current.value}", trying fallback locale`)
      str = getObjectValueByPath(fallbackLocale, shortKey, null)
    }

    if (!str) {
      consoleError(`Translation key "${shortKey}" not found in fallback`)
      str = shortKey
    }

    return replace(str, params)
  }
}

export function createLocale (options?: LocaleOptions) {
  const current = ref(options?.defaultLocale ?? 'en-US')
  const fallback = ref(options?.fallbackLocale ?? 'en-US')
  const locales = ref(options?.locales ?? { 'en-US': enUS })

  return {
    locales,
    current,
    fallback,
    translate: createTranslateFunction(current, fallback, locales),
  }
}

export function useLocale () {
  const locale = inject(VuetifyLocaleSymbol)

  if (!locale) throw new Error('Could not find Vuetify locale injection')

  return locale
}

export function provideLocale (props: { locale?: string, fallbackLocale?: string }) {
  const locale = useLocale()

  const current = computed(() => props.locale ?? locale.current.value)
  const fallback = computed(() => props.fallbackLocale ?? locale.fallback.value)

  provide(VuetifyLocaleSymbol, {
    locales: locale.locales,
    current,
    fallback,
    translate: createTranslateFunction(current, fallback, locale.locales),
  })

  return { current }
}
