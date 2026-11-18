'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LienMessages from '@/components/LienMessages'
import LienMenu from '@/components/LienMenu'
import SuiviVisites from '@/components/SuiviVisites'

export default function Header() {
  const [connecte, setConnecte] = useState(false)
  const [estProf, setEstProf] = useState(false)
  const [ouvert, setOuvert] = useState(false)

  useEffect(() => {
    if (!ouvert) return
    const f = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false)
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [ouvert])

  async function chargerRole(userId: string | undefined) {
    if (!userId) {
      setEstProf(false)
      return
    }
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    setEstProf(data?.role === 'professeur')
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setConnecte(!!data.user)
      chargerRole(data.user?.id)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setConnecte(!!session)
      setTimeout(() => chargerRole(session?.user?.id), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  function fermerSiLien(e: React.MouseEvent) {
    // un clic sur un lien ou un bouton du menu referme le menu sur téléphone
    if ((e.target as HTMLElement).closest('a, button')) setOuvert(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
      <SuiviVisites />
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 px-5 py-2.5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="ClicAnglais, accueil">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl bg-navy text-white shadow-[0_8px_16px_-8px_rgb(45_58_107/0.8)]"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5h16v11H10l-5 4v-4H4z" />
              <circle cx="12" cy="10.5" r="1.4" fill="#e8652d" stroke="none" />
            </svg>
          </span>
          <span className="text-[1.65rem] font-extrabold leading-none tracking-tight text-navy">
            Clic<span className="text-brand">Anglais</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          aria-controls="menu-principal"
          className="grid size-11 place-items-center rounded-xl border border-line text-navy md:hidden"
        >
          <span className="sr-only">{ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {ouvert ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>

        <div
          id="menu-principal"
          onClick={fermerSiLien}
          className={`entete-liens menu-liens ${
            ouvert ? 'flex' : 'hidden'
          } max-h-[75vh] w-full flex-col gap-1 overflow-y-auto pb-3 pt-3 md:flex md:max-h-none md:w-auto md:flex-row md:items-center md:gap-1 md:overflow-visible md:p-0`}
        >
          <LienMenu href="/cours" className="lien-nav">Cours</LienMenu>
          {connecte && <LienMenu href="/mes-cours" className="lien-nav">Mes cours</LienMenu>}
          {connecte && !estProf && <LienMenu href="/direct" className="lien-nav">Direct</LienMenu>}
          {connecte && !estProf && <LienMenu href="/evaluations" className="lien-nav">Évaluations</LienMenu>}
          {connecte && <LienMenu href="/club" className="lien-nav">Club</LienMenu>}
          {connecte && !estProf && <LienMessages href="/messages" className="lien-nav" />}
          {estProf && (
            <LienMenu href="/admin" className="lien-nav font-bold text-brand-deep">
              Espace professeur
            </LienMenu>
          )}
          {connecte ? (
            <button onClick={() => supabase.auth.signOut()} className="lien-nav text-left">
              Déconnexion
            </button>
          ) : (
            <>
              <LienMenu href="/connexion" className="lien-nav">Connexion</LienMenu>
              <Link
                href="/inscription"
                className="menu-bouton mt-1 rounded-xl bg-brand-deep px-5 py-3 text-center font-bold text-white shadow-[0_8px_18px_-8px_rgb(201_80_27/0.7)] md:ml-2 md:mt-0 md:rounded-full md:py-2"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
