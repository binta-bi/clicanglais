'use client'
// Tableau de bord du professeur. Toutes les données viennent de la base (aucun chiffre inventé).
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

type Tentatives = { reussi: number; echoue: number; expire: number; en_cours: number }
type Stats = {
  inscrits: number
  inscrits_30j: number
  acheteurs: number
  achats: number
  encaisse_reel: number
  encaisse_30j: number
  messages_non_lus: number
  tests: { test1: Tentatives; test2: Tentatives }
}
type Eleve = { id: string; nom: string; email: string; inscrit_le: string }
type Paiement = {
  id: string
  eleve: string
  achat: string
  montant: number
  declare_le: string
  traite_le: string | null
  status: 'en_attente' | 'paye' | 'echoue'
}
type Cours = { id: string; title: string; is_published: boolean; created_at?: string | null }
type Conversation = {
  student_id: string
  full_name: string | null
  last_content: string
  last_at: string
  last_sender: 'eleve' | 'professeur'
  unread: number
}

const fcfa = (n: number) => `${Number(n).toLocaleString('fr-FR')} FCFA`
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const jour = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const cleMois = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`

// Les 6 derniers mois (le plus ancien d'abord)
function derniersMois(n = 6) {
  const auj = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(auj.getFullYear(), auj.getMonth() - (n - 1 - i), 1)
    return { cle: cleMois(d), label: MOIS_COURTS[d.getMonth()] }
  })
}

// ---- Icônes -----------------------------------------------------------------------------
function Ico({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}
const ICONES = {
  cours: <Ico><path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H11v15H4.5A1.5 1.5 0 0 1 3 17.5v-12ZM21 5.5A1.5 1.5 0 0 0 19.5 4H13v15h6.5a1.5 1.5 0 0 0 1.5-1.5v-12Z" /></Ico>,
  publie: <Ico><circle cx="12" cy="12" r="9" /><path d="m8 12.3 2.8 2.8L16.2 9.5" /></Ico>,
  eleves: <Ico><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.7a3.5 3.5 0 0 1 0 6.6" /></Ico>,
  ventes: <Ico><path d="M3 4h2l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.4-1L20 8H6.2M9.5 20h.01M17 20h.01" /></Ico>,
  revenus: <Ico><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6.5 9.5v.01M17.5 14.5v.01" /></Ico>,
  tests: <Ico><path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1ZM8 6H6.5A1.5 1.5 0 0 0 5 7.5v12A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 17.5 6H16M9 12l2 2 4-4" /></Ico>,
  plus: <Ico><path d="M12 5v14M5 12h14" /></Ico>,
  video: <Ico><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></Ico>,
  message: <Ico><path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" /></Ico>,
  paiement: <Ico><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-9ZM3 10h18" /></Ico>,
}

// ---- Carte statistique ---------------------------------------------------------------------
function CarteStat({ icone, titre, valeur, detail, href }: { icone: ReactNode; titre: string; valeur: string | number; detail?: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-navy/10 text-navy transition-colors group-hover:bg-navy group-hover:text-white">
        {icone}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ardoise-texte">{titre}</span>
        <span className="mt-0.5 block text-2xl font-extrabold tabular-nums text-nuit">{valeur}</span>
        {detail && <span className="mt-0.5 block text-sm text-ardoise-texte">{detail}</span>}
      </span>
    </Link>
  )
}

// ---- Graphique en barres (sans bibliothèque) ------------------------------------------------
function Graphique({
  titre,
  sous,
  mois,
  valeurs,
  format,
}: {
  titre: string
  sous: string
  mois: { cle: string; label: string }[]
  valeurs: number[]
  format: (n: number) => string
}) {
  const max = Math.max(...valeurs, 0)
  const total = valeurs.reduce((a, b) => a + b, 0)
  const resume = mois.map((m, i) => `${m.label} : ${format(valeurs[i])}`).join(', ')
  return (
    <section aria-label={titre} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line">
      <h3 className="font-extrabold text-nuit">{titre}</h3>
      <p className="text-sm text-ardoise-texte">{sous}</p>
      {total === 0 ? (
        <p className="mt-6 rounded-xl bg-mist p-4 text-sm text-ardoise-texte">Pas encore de données sur cette période.</p>
      ) : (
        <div role="img" aria-label={`${titre}. ${resume}`} className="mt-5 flex h-40 items-end gap-2">
          {mois.map((m, i) => {
            const v = valeurs[i]
            const h = max > 0 ? Math.max(v > 0 ? 6 : 0, (v / max) * 100) : 0
            return (
              <div key={m.cle} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" aria-hidden="true">
                <span className="max-w-full truncate text-[0.7rem] font-bold tabular-nums text-nuit">{v > 0 ? format(v) : ''}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-navy to-royal" style={{ height: `${h}%` }} />
                <span className="text-[0.7rem] text-ardoise-texte">{m.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ---- Bloc d'activité ---------------------------------------------------------------------------
function Activite({ titre, lien, vide, children, nb }: { titre: string; lien: string; vide: string; children: ReactNode; nb: number }) {
  return (
    <section aria-label={titre} className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-extrabold text-nuit">{titre}</h3>
        <Link href={lien} className="text-sm font-semibold text-royal hover:underline">
          Voir tout
        </Link>
      </div>
      {nb === 0 ? (
        <p className="mt-4 rounded-xl bg-mist p-4 text-sm text-ardoise-texte">{vide}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-line">{children}</ul>
      )}
    </section>
  )
}

function Ligne({ titre, detail, droite }: { titre: string; detail?: string; droite?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="min-w-0">
        <span className="block truncate font-medium text-nuit">{titre}</span>
        {detail && <span className="block truncate text-sm text-ardoise-texte">{detail}</span>}
      </span>
      {droite && <span className="shrink-0 text-sm font-semibold text-ardoise-texte">{droite}</span>}
    </li>
  )
}

// ---- Raccourcis -----------------------------------------------------------------------------------
const RACCOURCIS: { href: string; nom: string; icone: ReactNode }[] = [
  { href: '/admin/cours', nom: 'Créer un cours', icone: ICONES.plus },
  { href: '/admin/cours', nom: 'Gérer mes cours', icone: ICONES.cours },
  { href: '/admin/cours', nom: 'Ajouter une vidéo', icone: ICONES.video },
  { href: '/admin/evaluations', nom: 'Créer un test', icone: ICONES.tests },
  { href: '/admin/eleves', nom: 'Consulter mes élèves', icone: ICONES.eleves },
  { href: '/admin/statistiques', nom: 'Voir mes revenus', icone: ICONES.revenus },
]

export default function AdminAccueil() {
  const [prenom, setPrenom] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [cours, setCours] = useState<Cours[]>([])
  const [convs, setConvs] = useState<Conversation[]>([])
  const [nbTests, setNbTests] = useState(0)
  const [nbEvals, setNbEvals] = useState(0)
  const [attente, setAttente] = useState(0)
  const [erreur, setErreur] = useState('')
  const [pret, setPret] = useState(false)

  useEffect(() => {
    let annule = false
    async function charger() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const [prof, st, el, pa, tests, evals, cv, att] = await Promise.all([
        user ? supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.rpc('admin_stats'),
        supabase.rpc('prof_eleves'),
        supabase.rpc('prof_paiements'),
        supabase.from('tests').select('code'),
        supabase.rpc('prof_eval_liste'),
        supabase.rpc('conversations'),
        supabase.rpc('prof_nb_paiements'),
      ])
      // Les cours : on essaie avec la date de création, sinon sans
      let c = await supabase.from('courses').select('id, title, is_published, created_at')
      if (c.error) c = (await supabase.from('courses').select('id, title, is_published')) as typeof c
      if (annule) return

      const nom = (prof.data as { full_name: string | null } | null)?.full_name?.trim() ?? ''
      setPrenom(nom.split(/\s+/)[0] ?? '')
      if (st.error) setErreur(st.error.message)
      else setStats(st.data as Stats)
      setEleves((el.data as Eleve[]) || [])
      setPaiements((pa.data as Paiement[]) || [])
      setCours((c.data as Cours[]) || [])
      setConvs((cv.data as Conversation[]) || [])
      setNbTests(((tests.data as unknown[]) || []).length)
      setNbEvals(((evals.data as unknown[]) || []).length)
      setAttente(typeof att.data === 'number' ? att.data : 0)
      setPret(true)
    }
    charger()
    return () => {
      annule = true
    }
  }, [])

  const mois = derniersMois()
  const payes = paiements.filter((p) => p.status === 'paye')
  const datePaiement = (p: Paiement) => p.traite_le ?? p.declare_le
  const parMois = (dates: string[], poids?: number[]) =>
    mois.map((m) => dates.reduce((s, d, i) => (cleMois(new Date(d)) === m.cle ? s + (poids ? poids[i] : 1) : s), 0))
  const ventesMois = parMois(payes.map(datePaiement))
  const revenusMois = parMois(
    payes.map(datePaiement),
    payes.map((p) => Number(p.montant)),
  )
  const inscritsMois = parMois(eleves.map((e) => e.inscrit_le))

  const publies = cours.filter((c) => c.is_published)
  const derniersPublies = [...publies].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')).slice(0, 4)
  const dernieresInscriptions = [...eleves].sort((a, b) => b.inscrit_le.localeCompare(a.inscrit_le)).slice(0, 4)
  const dernieresVentes = [...payes].sort((a, b) => datePaiement(b).localeCompare(datePaiement(a))).slice(0, 4)
  const derniersMessages = convs.filter((c) => c.last_sender === 'eleve').slice(0, 4)
  const tentatives = stats
    ? [stats.tests.test1, stats.tests.test2].reduce((s, t) => s + t.reussi + t.echoue + t.expire + t.en_cours, 0)
    : 0

  return (
    <div className="flex flex-col gap-8 pb-12">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-nuit via-navy to-royal p-6 text-white shadow-[0_24px_50px_-30px_rgb(20_36_58/0.8)] sm:p-8">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          {prenom ? `Bonjour ${prenom}` : 'Espace professeur'}
        </h1>
        <p className="mt-2 max-w-xl text-lg text-white/85">
          Voici l’activité de ta plateforme : élèves, ventes et messages, en un coup d’œil.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {attente > 0 && (
            <Link href="/admin/paiements" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-nuit hover:bg-mist">
              {ICONES.paiement}
              {attente} paiement{attente > 1 ? 's' : ''} à valider
            </Link>
          )}
          {stats && stats.messages_non_lus > 0 && (
            <Link href="/admin/messages" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-nuit hover:bg-mist">
              {ICONES.message}
              {stats.messages_non_lus} message{stats.messages_non_lus > 1 ? 's' : ''} non lu{stats.messages_non_lus > 1 ? 's' : ''}
            </Link>
          )}
          {attente === 0 && (!stats || stats.messages_non_lus === 0) && pret && (
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">Rien à traiter pour le moment</span>
          )}
        </div>
      </header>

      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
      {!pret && <p role="status">Chargement...</p>}

      {pret && (
        <>
          <section aria-label="Raccourcis" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {RACCOURCIS.map((r) => (
              <Link
                key={r.nom}
                href={r.href}
                className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center text-sm font-bold text-nuit shadow-sm ring-1 ring-line transition-all hover:-translate-y-0.5 hover:bg-navy hover:text-white hover:shadow-md"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-navy/10 text-navy group-hover:bg-white/15 group-hover:text-white">
                  {r.icone}
                </span>
                {r.nom}
              </Link>
            ))}
          </section>

          <section aria-label="Chiffres clés" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CarteStat icone={ICONES.cours} titre="Cours créés" valeur={cours.length} href="/admin/cours" detail={`${cours.length - publies.length} en brouillon`} />
            <CarteStat icone={ICONES.publie} titre="Cours publiés" valeur={publies.length} href="/admin/cours" />
            <CarteStat
              icone={ICONES.eleves}
              titre="Élèves inscrits"
              valeur={stats?.inscrits ?? eleves.length}
              href="/admin/eleves"
              detail={stats ? `${stats.inscrits_30j} sur les 30 derniers jours` : undefined}
            />
            <CarteStat
              icone={ICONES.ventes}
              titre="Ventes réalisées"
              valeur={stats?.achats ?? 0}
              href="/admin/paiements"
              detail={stats ? `${stats.acheteurs} élève${stats.acheteurs > 1 ? 's' : ''} acheteur${stats.acheteurs > 1 ? 's' : ''}` : undefined}
            />
            <CarteStat
              icone={ICONES.revenus}
              titre="Revenus générés"
              valeur={fcfa(stats?.encaisse_reel ?? 0)}
              href="/admin/statistiques"
              detail={stats ? `dont ${fcfa(stats.encaisse_30j)} sur 30 jours` : undefined}
            />
            <CarteStat
              icone={ICONES.tests}
              titre="Tests et évaluations"
              valeur={nbTests + nbEvals}
              href="/admin/resultats"
              detail={`${nbTests} test${nbTests > 1 ? 's' : ''} de niveau, ${nbEvals} évaluation${nbEvals > 1 ? 's' : ''} · ${tentatives} passage${tentatives > 1 ? 's' : ''}`}
            />
          </section>

          <section aria-label="Évolution" className="grid gap-4 lg:grid-cols-3">
            <Graphique titre="Ventes" sous="Paiements validés par mois" mois={mois} valeurs={ventesMois} format={(n) => String(n)} />
            <Graphique
              titre="Revenus"
              sous="Montants validés par mois (FCFA)"
              mois={mois}
              valeurs={revenusMois}
              format={(n) => (n >= 1000 ? `${Math.round(n / 1000)} k` : String(n))}
            />
            <Graphique titre="Inscriptions" sous="Nouveaux élèves par mois" mois={mois} valeurs={inscritsMois} format={(n) => String(n)} />
          </section>

          <section aria-label="Activité récente" className="flex flex-col gap-4">
            <h2 className="text-xl font-extrabold text-nuit">Activité récente</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Activite titre="Dernières inscriptions" lien="/admin/eleves" nb={dernieresInscriptions.length} vide="Aucun élève inscrit pour l’instant.">
                {dernieresInscriptions.map((e) => (
                  <Ligne key={e.id} titre={e.nom || e.email} detail={e.email} droite={jour(e.inscrit_le)} />
                ))}
              </Activite>
              <Activite titre="Dernières ventes" lien="/admin/paiements" nb={dernieresVentes.length} vide="Aucune vente validée pour l’instant.">
                {dernieresVentes.map((p) => (
                  <Ligne key={p.id} titre={p.eleve} detail={`${p.achat} · ${fcfa(p.montant)}`} droite={jour(datePaiement(p))} />
                ))}
              </Activite>
              <Activite titre="Derniers cours publiés" lien="/admin/cours" nb={derniersPublies.length} vide="Aucun cours publié pour l’instant.">
                {derniersPublies.map((c) => (
                  <Ligne key={c.id} titre={c.title} droite={c.created_at ? jour(c.created_at) : undefined} />
                ))}
              </Activite>
              <Activite titre="Derniers messages reçus" lien="/admin/messages" nb={derniersMessages.length} vide="Aucun message d’élève pour l’instant.">
                {derniersMessages.map((m) => (
                  <Ligne
                    key={m.student_id}
                    titre={`${m.full_name ?? 'Élève'}${m.unread > 0 ? ` · ${m.unread} non lu${m.unread > 1 ? 's' : ''}` : ''}`}
                    detail={m.last_content || 'Pièce jointe'}
                    droite={jour(m.last_at)}
                  />
                ))}
              </Activite>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
