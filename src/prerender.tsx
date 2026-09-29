// Eseguito solo durante la build (vedi il plugin prerenderHome in vite.config.ts): scrive la
// home nell'HTML, così motori di ricerca e assistenti AI la leggono senza eseguire JavaScript.
// Nel browser React la ridisegna identica al primo avvio.

import { renderToString } from 'react-dom/server'
import { faqs } from '@/app/faq'
import { SignInScreen } from '@/app/SignInScreen'
import { AuthProvider } from '@/state/auth'

const URL = 'https://duetrack.federicodiluca.com/'
const author = { '@type': 'Person', name: 'Federico Di Luca', url: 'https://federicodiluca.com/' }

export function renderHome() {
  return renderToString(
    <AuthProvider>
      <SignInScreen />
    </AuthProvider>,
  )
}

/** Dati strutturati (schema.org): cos'è Duetrack, chi l'ha fatto e cosa risponde la pagina. */
export function structuredData() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Duetrack',
      url: URL,
      description:
        'App gratuita per chi lavora a ore: legge le sessioni da Google Calendar, calcola quanto deve ogni cliente in base a durata e tariffa oraria e tiene traccia di pagamenti e resoconti.',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Android, iOS, Windows, macOS, Linux',
      browserRequirements: 'Browser moderno (Chrome, Edge, Safari, Firefox)',
      inLanguage: 'it',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      image: `${URL}social-share.png`,
      author,
      creator: author,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ]
}
