'use client'
// Habillage commun des pages de connexion, d'inscription et de mot de passe (apparence uniquement).
import { useState } from 'react'
import type { ReactNode } from 'react'

const Coche = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-cuivre" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
  </svg>
)

// Page en deux colonnes (photo + message à gauche sur ordinateur) ; sans photo : simple carte centrée.
export function AuthShell({
  photo,
  titre,
  accroche,
  puces,
  children,
}: {
  photo?: string
  titre?: string
  accroche?: string
  puces?: string[]
  children: ReactNode
}) {
  if (!photo) {
    return (
      <div className="hero-ivoire min-h-[calc(100dvh-4.2rem)] px-4 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    )
  }
  const fond = { backgroundImage: `url(${photo})` }
  return (
    <div className="grid min-h-[calc(100dvh-4.2rem)] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-royal to-nuit lg:block">
        <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={fond} />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/70 to-nuit/20" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <h2 className="max-w-md text-balance text-4xl font-extrabold leading-tight tracking-tight">{titre}</h2>
          {accroche && <p className="mt-3 max-w-md text-lg leading-relaxed text-white/85">{accroche}</p>}
          {puces && (
            <ul className="mt-6 flex max-w-md flex-col gap-3">
              {puces.map((p) => (
                <li key={p} className="flex gap-3 font-medium">
                  <Coche />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <div className="hero-ivoire flex items-start justify-center px-4 py-6 sm:py-10 lg:items-center lg:py-14">
        <div className="w-full max-w-md">
          {/* bandeau photo sur téléphone et tablette */}
          <div className="relative mb-5 h-28 overflow-hidden rounded-3xl bg-gradient-to-br from-royal to-nuit lg:hidden">
            <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={fond} />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-nuit/90 via-nuit/60 to-nuit/20" />
            <p className="absolute inset-0 flex items-center p-5 text-xl font-extrabold leading-tight text-white">
              <span className="max-w-[16rem] text-balance">{titre}</span>
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export function AuthCarte({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl bg-white p-6 shadow-[0_30px_60px_-36px_rgb(20_36_58/0.5)] ring-1 ring-nuit/10 sm:p-8 ${className}`}
    >
      {children}
    </div>
  )
}

export function AuthTitre({ titre, sous }: { titre: string; sous?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-nuit">{titre}</h1>
      {sous && <p className="mt-2 leading-relaxed text-ardoise-texte">{sous}</p>}
    </div>
  )
}

// Un champ de formulaire : libellé relié au champ par son identifiant
export function Champ({ id, label, aide, children }: { id: string; label: string; aide?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-nuit">
        {label}
      </label>
      {children}
      {aide && <p className="text-sm text-ardoise-texte">{aide}</p>}
    </div>
  )
}

// Champ mot de passe avec un bouton pour voir ce qu'on tape
export function ChampMotDePasse({
  id,
  value,
  onChange,
  minLength,
  autoComplete,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  minLength?: number
  autoComplete?: string
}) {
  const [vu, setVu] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={vu ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minLength={minLength}
        autoComplete={autoComplete}
        className="champ-auth pr-12"
        required
      />
      <button
        type="button"
        onClick={() => setVu((v) => !v)}
        aria-pressed={vu}
        className="absolute inset-y-0 right-1 grid w-11 place-items-center rounded-full text-ardoise-texte transition-colors hover:text-navy"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {vu ? (
            <path d="M3 3l18 18M10.6 6.2A9.5 9.5 0 0 1 12 6c5 0 8.5 4 9.5 6a12 12 0 0 1-2.4 3M6.5 7.6A12.4 12.4 0 0 0 2.5 12c1 2 4.5 6 9.5 6 1.5 0 2.8-.3 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          ) : (
            <>
              <path d="M2.5 12c1-2 4.5-6 9.5-6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
        <span className="sr-only">{vu ? 'Masquer' : 'Afficher'}</span>
      </button>
    </div>
  )
}

export function MessageErreur({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800 ring-1 ring-red-200">
      {children}
    </p>
  )
}

export function IconeRonde({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="mb-5 grid size-14 place-items-center rounded-2xl bg-cuivre/15 text-brand-dark">
      <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  )
}
