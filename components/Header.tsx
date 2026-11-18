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
  const [defile, setDefile] = useState(false)

  useEffect(() => {
    const f = () => setDefile(window.scrollY > 8)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

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
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300 ${
        defile || ouvert
          ? 'border-nuit/10 bg-white/90 shadow-[0_12px_30px_-22px_rgb(20_36_58/0.55)]'
          : 'border-transparent bg-ivoire/75'
      }`}
    >
      <SuiviVisites />
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 px-5 py-3">
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
          className="grid size-11 place-items-center rounded-full border border-nuit/15 bg-white text-nuit shadow-sm transition-colors hover:border-royal/40 md:hidden"
        >
          <span className="sr-only">{ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {ouvert ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>

        <div id="menu-principal" data-ouvert={ouvert} onClick={fermerSiLien} className="nav-panneau">
          <div>
            <div className="nav-liens flex flex-col pb-4 pt-2 md:flex-row md:items-center md:gap-1 md:p-0">
              <LienMenu href="/cours" className="nav-lien">Cours</LienMenu>
              {connecte && <LienMenu href="/mes-cours" className="nav-lien">Mes cours</LienMenu>}
              {connecte && !estProf && <LienMenu href="/direct" className="nav-lien">Direct</LienMenu>}
              {connecte && !estProf && <LienMenu href="/evaluations" className="nav-lien">Évaluations</LienMenu>}
              {connecte && <LienMenu href="/club" className="nav-lien">Club</LienMenu>}
              {connecte && !estProf && <LienMessages href="/messages" className="nav-lien" />}
              {estProf && (
                <LienMenu href="/admin" className="nav-lien font-bold !text-royal">
                  Espace professeur
                </LienMenu>
              )}
              {connecte ? (
                <button onClick={() => supabase.auth.signOut()} className="nav-lien text-left">
                  Déconnexion
                </button>
              ) : (
                <>
                  <LienMenu href="/connexion" className="nav-lien">Connexion</LienMenu>
                  <Link href="/inscription" className="nav-cta">
                    Inscription
                    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 10h12m-5-5 5 5-5 5" />
                    </svg>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
