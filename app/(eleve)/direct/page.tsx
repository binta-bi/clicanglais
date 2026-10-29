'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { idYoutube } from '@/lib/youtube'

type Seance = {
  id: string
  title: string
  starts_at: string
  ends_at: string
  join_url: string | null
  replay_url: string | null
  courses: { title: string } | null
}

const AVANT_MS = 15 * 60 * 1000

function quand(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const estVideo = (url: string) => /\.(mp4|webm)(\?|#|$)/i.test(url)

export default function Direct() {
  const router = useRouter()
  const [seances, setSeances] = useState<Seance[]>([])
  const [pret, setPret] = useState(false)
  const [maintenant, setMaintenant] = useState(0)

  useEffect(() => {
    let annule = false
    async function charger() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/connexion')
        return
      }
      // La base ne renvoie que les séances des cours achetés par cet élève
      const { data } = await supabase
        .from('live_sessions')
        .select('id, title, starts_at, ends_at, join_url, replay_url, courses(title)')
        .order('starts_at')
      if (annule) return
      setSeances((data as unknown as Seance[]) || [])
      setMaintenant(Date.now())
      setPret(true)
    }
    charger()
    return () => {
      annule = true
    }
  }, [router])

  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  if (!pret) {
    return (
      <p role="status" className="mx-auto mt-16 max-w-3xl px-5 text-center text-lg">
        Chargement...
      </p>
    )
  }

  const aVenir = seances.filter((s) => new Date(s.ends_at).getTime() >= maintenant)
  const passees = seances
    .filter((s) => new Date(s.ends_at).getTime() < maintenant && s.replay_url)
    .reverse()

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Cours en direct</h1>
      <p className="mt-2 text-ink/80">Les séances et les rediffusions des cours que tu as achetés.</p>

      {seances.length === 0 && (
        <div className="mt-8 rounded-2xl bg-mist p-6">
          <p className="font-medium">Aucune séance pour l&apos;instant.</p>
          <p className="mt-1">
            Les séances en direct sont réservées aux élèves qui ont acheté un cours. Si tu as déjà un cours, le
            professeur n&apos;a pas encore programmé de séance.
          </p>
          <Link href="/cours" className="btn-primary mt-4">
            Voir les cours
          </Link>
        </div>
      )}

      {aVenir.length > 0 && (
        <section className="mt-8" aria-labelledby="titre-avenir">
          <h2 id="titre-avenir" className="text-xl font-bold">
            À venir
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {aVenir.map((s) => {
              const debut = new Date(s.starts_at).getTime()
              const ouvert = maintenant >= debut - AVANT_MS
              const enCours = maintenant >= debut
              return (
                <li key={s.id} className="rounded-2xl p-5 ring-1 ring-line">
                  <p className="text-sm text-ink/70">{s.courses?.title}</p>
                  <p className="text-lg font-bold">{s.title}</p>
                  <p className="mt-1 first-letter:uppercase">{quand(s.starts_at)}</p>
                  {enCours && <p className="mt-1 font-bold text-brand-dark">En cours maintenant</p>}
                  <div className="mt-3">
                    {s.join_url && ouvert ? (
                      <a href={s.join_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                        Rejoindre la séance
                      </a>
                    ) : (
                      <p className="text-sm text-ink/70">
                        {s.join_url
                          ? 'Le lien s’active 15 minutes avant le début.'
                          : 'Le lien de la séance sera ajouté par le professeur.'}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {passees.length > 0 && (
        <section className="mt-10" aria-labelledby="titre-replays">
          <h2 id="titre-replays" className="text-xl font-bold">
            Rediffusions
          </h2>
          <ul className="mt-3 flex flex-col gap-4">
            {passees.map((s) => (
              <li key={s.id} className="rounded-2xl p-5 ring-1 ring-line">
                <p className="text-sm text-ink/70">{s.courses?.title}</p>
                <p className="text-lg font-bold">{s.title}</p>
                <p className="mt-1 first-letter:uppercase">{quand(s.starts_at)}</p>
                {s.replay_url && idYoutube(s.replay_url) ? (
                  <div className="mt-3 aspect-video w-full overflow-hidden rounded bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${idYoutube(s.replay_url)}?rel=0`}
                      title={s.title}
                      allow="encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                      className="size-full"
                    />
                  </div>
                ) : s.replay_url && estVideo(s.replay_url) ? (
                  <video
                    src={s.replay_url}
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    className="mt-3 w-full rounded bg-black"
                  />
                ) : (
                  <a href={s.replay_url ?? '#'} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-3">
                    Revoir la séance
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
