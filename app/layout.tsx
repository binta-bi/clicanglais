import type { Metadata } from 'next'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'ClicAnglais',
  description:
    'Cours d’anglais en direct, avec replays et transcriptions cliquables. Trois niveaux, du Débutant à l’Avancé.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
