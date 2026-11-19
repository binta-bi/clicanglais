'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { NOM_NIVEAU, type NiveauSlug } from '@/lib/tests'
import { verifierPaiementWave } from '@/lib/wave-client'

type Achat = {
  id: string
  courses: { id: string; title: string; niveau: string; mois: number | null } | null
}

type Avancement = { total: number; vues: number }

const PHOTO: Record<string, string> = {
  debutant: '/niveau-debutant.jpg',
  intermediaire: '/niveau-intermediaire.jpg',
  avance: '/niveau-avance.jpg',
}

type Attente = { id: string; kind: string; niveau: string | null; amount: number; courses: { title: string } | null }

const ORDRE: Record<string, number> = { debutant: 0, intermediaire: 1, avance: 2 }

export default function MesCours() {
  const [achats, setAchats] = useState<Achat[]>([])
  const [attente, setAttente] = useState<Attente[]>([])
  const [avance, setAvance] = useState<Record<string, Avancement>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/connexion')
        return
      }
      // Rattrapage : un paiement Wave fait mais pas encore confirmé (page fermée trop tôt)
      const { data: attente } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'en_attente')
        .eq('provider', 'wave')
        .order('created_at', { ascending: false })
        .limit(3)
      for (const o of (attente as { id: string }[]) || []) {
        try {
          await verifierPaiementWave(o.id)
        } catch {
          // sans gravité : l'élève pourra revérifier depuis la page de paiement
        }
      }
      // Paiements déclarés, en attente de validation par le professeur
      const { data: enAttente } = await supabase
        .from('orders')
        .select('id, kind, niveau, amount, courses(title)')
        .eq('status', 'en_attente')
        .eq('provider', 'manuel')
        .not('declare_le', 'is', null)
        .order('created_at', { ascending: false })
      setAttente((enAttente as unknown as Attente[]) || [])
      const { data } = await supabase
        .from('purchases')
        .select('id, courses(id, title, niveau, mois)')
        .eq('status', 'valide')
      const liste = ((data as unknown as Achat[]) || [])
        .filter((a) => a.courses)
        .sort((a, b) => {
          const x = a.courses!
          const y = b.courses!
          return (ORDRE[x.niveau] ?? 9) - (ORDRE[y.niveau] ?? 9) || (x.mois ?? 0) - (y.mois ?? 0)
        })
      setAchats(liste)
      // Avancement par cours (lecture seule ; sans effet sur le reste si cela échoue)
      try {
        const { data: lec } = await supabase.from('lessons').select('id, course_id')
        const { data: prog } = await supabase.from('progress').select('lesson_id').eq('completed', true)
        const faites = new Set(((prog as { lesson_id: string }[]) || []).map((p) => p.lesson_id))
        const par: Record<string, Avancement> = {}
        for (const l of (lec as { id: string; course_id: string }[]) || []) {
          const a = (par[l.course_id] ??= { total: 0, vues: 0 })
          a.total += 1
          if (faites.has(l.id)) a.vues += 1
        }
        setAvance(par)
      } catch {
        // l'avancement est un plus : on affiche les cours sans barre
      }
      setLoading(false)
    }
    load()
  }, [router])

  return (
    <div className="hero-ivoire min-h-[calc(100dvh-4.2rem)]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:py-14">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-nuit sm:text-4xl">Mes cours</h1>
          <p className="mt-2 text-lg text-ardoise-texte">Retrouve tes cours et reprends là où tu t’es arrêté.</p>
        </header>

        {loading && <p role="status">Chargement...</p>}

        {attente.length > 0 && (
          <div className="rounded-3xl bg-white p-5 ring-2 ring-cuivre">
            <p className="font-extrabold text-nuit">Paiement en attente de validation</p>
            <ul className="mt-2 flex flex-col gap-1">
              {attente.map((o) => (
                <li key={o.id}>
                  <Link href={`/paiement/${o.id}`} className="font-semibold text-royal underline">
                    {o.kind === 'niveau' && o.niveau
                      ? `Niveau ${NOM_NIVEAU[o.niveau as NiveauSlug] ?? o.niveau} complet`
                      : (o.courses?.title ?? 'Cours')}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-ardoise-texte">
              Le professeur vérifie ton paiement. Ton cours apparaîtra ici dès qu&apos;il sera validé.
            </p>
          </div>
        )}

        {!loading && achats.length === 0 && (
          <div className="rounded-3xl bg-white p-6 ring-1 ring-nuit/10">
            <p className="font-extrabold text-nuit">Tu n&apos;as acheté aucun cours pour l&apos;instant.</p>
            <p className="mt-1 text-ardoise-texte">
              Chaque mois de cours s&apos;achète séparément, ou tu peux prendre un niveau complet. Tes cours
              apparaîtront ici dès l&apos;achat.
            </p>
            <Link href="/cours" className="btn-hero mt-4">
              Voir les cours
            </Link>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {achats.map((a) => {
            const c = a.courses!
            const av = avance[c.id]
            const pct = av && av.total > 0 ? Math.round((av.vues / av.total) * 100) : 0
            return (
              <Link
                key={a.id}
                href={`/mes-cours/${c.id}`}
                className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_20px_44px_-30px_rgb(20_36_58/0.55)] ring-1 ring-nuit/10 transition-all duration-200 hover:-translate-y-1"
              >
                <div className="relative h-28 overflow-hidden bg-gradient-to-br from-royal to-nuit">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${PHOTO[c.niveau] ?? PHOTO.debutant})` }}
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-nuit/80 to-transparent" />
                  <span className="absolute bottom-3 left-4 rounded-full bg-cuivre px-3 py-1 text-xs font-extrabold text-nuit">
                    {NOM_NIVEAU[c.niveau as NiveauSlug] ?? c.niveau}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="text-lg font-extrabold leading-snug text-nuit">{c.title}</h2>
                  <p className="text-sm text-ardoise-texte">
                    Niveau {NOM_NIVEAU[c.niveau as NiveauSlug] ?? c.niveau}
                    {c.mois ? ` · Mois ${c.mois} sur 3` : ''}
                  </p>
                  {av && av.total > 0 && (
                    <div>
                      <div
                        role="progressbar"
                        aria-label="Avancement"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={pct}
                        className="h-2 overflow-hidden rounded-full bg-mist"
                      >
                        <div className="h-full rounded-full bg-cuivre" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-ardoise-texte">
                        {av.vues} / {av.total} leçons vues
                      </p>
                    </div>
                  )}
                  <p className="mt-auto pt-1 font-bold text-royal">
                    {av && av.vues > 0 ? 'Continuer →' : 'Commencer →'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {!loading && achats.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/evaluations"
              className="rounded-2xl bg-white p-5 font-bold text-nuit ring-1 ring-nuit/10 transition-shadow hover:shadow-md"
            >
              Évaluations de fin de mois et de niveau →
            </Link>
            <Link
              href="/direct"
              className="rounded-2xl bg-white p-5 font-bold text-nuit ring-1 ring-nuit/10 transition-shadow hover:shadow-md"
            >
              Cours en direct et rediffusions →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
