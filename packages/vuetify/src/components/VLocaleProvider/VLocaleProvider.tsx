import { provideLocale } from '@/composables/locale'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'VLocaleProvider',

  props: {
    locale: String,
    fallbackLocale: String
  },

  setup (props, ctx) {
    provideLocale(props)

    return () => ctx.slots.default?.()
  }
})
