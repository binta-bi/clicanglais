// Éléments d'affichage communs au club et aux messages privés (apparence uniquement, aucune logique).
import type { ReactNode } from 'react'

// ---- Dates ---------------------------------------------------------------------------
export function cleJour(iso: string) {
  return new Date(iso).toDateString()
}

export function heureCourte(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function jourLabel(iso: string) {
  const d = new Date(iso)
  const auj = new Date()
  const hier = new Date(auj.getTime() - 86400000)
  if (d.toDateString() === auj.toDateString()) return 'Aujourd’hui'
  if (d.toDateString() === hier.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(d.getFullYear() !== auj.getFullYear() ? { year: 'numeric' as const } : {}),
  })
}

export function SeparateurJour({ iso }: { iso: string }) {
  return (
    <div className="my-2 flex justify-center">
      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ardoise-texte shadow-sm ring-1 ring-line first-letter:uppercase">
        {jourLabel(iso)}
      </span>
    </div>
  )
}

// ---- Avatar (initiales sur fond de couleur) ----------------------------------------------
const FONDS = ['bg-navy', 'bg-royal', 'bg-brand-dark', 'bg-[#2f7d5b]', 'bg-[#6b4a9c]']

export function Avatar({ nom, className = 'size-11 text-base' }: { nom: string; className?: string }) {
  const mots = nom.trim().split(/\s+/).filter(Boolean)
  const initiales = ((mots[0]?.[0] ?? '?') + (mots.length > 1 ? (mots[mots.length - 1][0] ?? '') : '')).toUpperCase()
  let h = 0
  for (const c of nom) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${FONDS[h % FONDS.length]} ${className}`}
    >
      {initiales}
    </span>
  )
}

// ---- Cadre de discussion ---------------------------------------------------------------
export function CarteChat({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_50px_-32px_rgb(20_36_58/0.55)] ring-1 ring-line ${className}`}
    >
      {children}
    </section>
  )
}

export function EnteteChat({
  avatar,
  titre,
  sous,
  gauche,
  h2,
  children,
}: {
  avatar?: ReactNode
  titre: ReactNode
  sous?: ReactNode
  gauche?: ReactNode // par ex. bouton « retour » sur téléphone
  h2?: boolean // titre de niveau 2 quand la page a déjà un titre principal
  children?: ReactNode
}) {
  return (
    <header className="bg-gradient-to-r from-navy to-ink px-4 py-3 text-white sm:px-5">
      <div className="flex items-center gap-3">
        {gauche}
        {avatar}
        <div className="min-w-0">
          {h2 ? (
            <h2 className="truncate text-lg font-extrabold leading-tight tracking-tight">{titre}</h2>
          ) : (
            <h1 className="truncate text-lg font-extrabold leading-tight tracking-tight">{titre}</h1>
          )}
          {sous && <p className="truncate text-sm text-white/75">{sous}</p>}
        </div>
      </div>
      {children}
    </header>
  )
}

export function Bandeau({ children }: { children: ReactNode }) {
  return <p className="border-b border-line bg-ivoire px-4 py-2 text-xs leading-snug text-ardoise-texte sm:px-5">{children}</p>
}

// ---- Une bulle de message -----------------------------------------------------------------
export function Bulle({
  mien,
  auteur,
  prof,
  heure,
  actions,
  children,
}: {
  mien: boolean
  auteur?: string
  prof?: boolean
  heure: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className={`flex ${mien ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] break-words rounded-2xl px-3.5 pb-1.5 pt-2 shadow-sm sm:max-w-[75%] ${
          mien ? 'bulle-mien rounded-br-md bg-navy text-white' : 'rounded-bl-md bg-white text-ink ring-1 ring-line'
        }`}
      >
        {auteur && !mien && (
          <p className="mb-1 flex flex-wrap items-center gap-x-2 text-[0.8rem] font-bold text-brand-dark">
            {auteur}
            {prof && (
              <span className="rounded bg-brand-dark px-1.5 py-px text-[0.65rem] font-bold uppercase tracking-wide text-white">
                Professeur
              </span>
            )}
          </p>
        )}
        <div className="flex flex-col gap-2">{children}</div>
        <p
          className={`mt-1 flex items-center justify-end gap-3 text-[0.7rem] ${
            mien ? 'text-white/75' : 'text-ardoise-texte'
          }`}
        >
          {actions}
          <time>{heure}</time>
        </p>
      </div>
    </div>
  )
}

// ---- Icônes -----------------------------------------------------------------------------
const base = { viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const IconeClip = () => (
  <svg {...base} className="size-[1.4rem]">
    <path d="m21 11-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6L15 6.4" />
  </svg>
)
export const IconeMicro = () => (
  <svg {...base} className="size-[1.4rem]">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
)
export const IconeEnvoi = () => (
  <svg {...base} className="size-5">
    <path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z" />
  </svg>
)
export const IconePoubelle = () => (
  <svg {...base} className="size-[1.3rem]">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
)
export const IconeFleche = () => (
  <svg {...base} className="size-5">
    <path d="M15 5 8 12l7 7" />
  </svg>
)
export const IconeGroupe = () => (
  <svg {...base} className="size-6 text-white">
    <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.7a3.5 3.5 0 0 1 0 6.6" />
  </svg>
)
export const IconeFichier = () => (
  <svg {...base} className="size-5 shrink-0 text-royal">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5" />
  </svg>
)

export function BoutonEnvoyer({ desactive, envoi }: { desactive: boolean; envoi: boolean }) {
  return (
    <button type="submit" disabled={desactive} className="bouton-envoi">
      <IconeEnvoi />
      <span className="sr-only">{envoi ? 'Envoi...' : 'Envoyer'}</span>
    </button>
  )
}
