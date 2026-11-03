'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'

// Vrai quand la page affichée est celle du lien (ou une page à l'intérieur)
function estActif(chemin: string | null, href: string) {
  if (!chemin) return false
  if (href === '/' || href === '/admin') return chemin === href
  return chemin === href || chemin.startsWith(href + '/')
}

type Props = { href: string; className?: string; children: React.ReactNode }

function Interne({ href, className, children }: Props) {
  const actif = estActif(usePathname(), href)
  return (
    <Link href={href} className={className} aria-current={actif ? 'page' : undefined}>
      {children}
    </Link>
  )
}

// Lien de menu : reste en couleur tant qu'on est sur sa page.
// usePathname() doit être lu sous <Suspense> pour que le site se compile en production.
export default function LienMenu(props: Props) {
  return (
    <Suspense
      fallback={
        <Link href={props.href} className={props.className}>
          {props.children}
        </Link>
      }
    >
      <Interne {...props} />
    </Suspense>
  )
}
