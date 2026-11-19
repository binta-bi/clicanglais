'use client'
import Link from 'next/link'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BoutonsPieces, PieceAffichee } from '@/components/PiecesJointes'
import PhotoProfil from '@/components/PhotoProfil'
import { useAvatars, oublierAvatar } from '@/lib/avatars'
import { Avatar, BoutonEnvoyer, Bulle, CarteChat, EnteteChat, IconeGroupe, SeparateurJour, cleJour, heureCourte } from '@/components/ChatUI'
import type { Piece, TypePiece } from '@/lib/pieces-jointes'

type Message = {
  id: string
  auteur_id: string
  auteur: string
  est_prof: boolean
  contenu: string
  created_at: string
  fichier_path: string | null
  fichier_type: TypePiece | null
  fichier_nom: string | null
}
type Exclu = { student_id: string; nom: string; email: string; motif: string | null }
type Statut = 'chargement' | 'ok' | 'achat' | 'exclu' | 'niveau'
type Niveau = 'debutant' | 'intermediaire' | 'avance'

const NIVEAUX: { code: Niveau; nom: string }[] = [
  { code: 'debutant', nom: 'Débutant' },
  { code: 'intermediaire', nom: 'Intermédiaire' },
  { code: 'avance', nom: 'Avancé' },
]

const MAX = 1000

export default function Club() {
  const router = useRouter()
  const [statut, setStatut] = useState<Statut>('chargement')
  const [moi, setMoi] = useState('')
  const [estProf, setEstProf] = useState(false)
  const [niveau, setNiveau] = useState<Niveau>('debutant')
  const [messages, setMessages] = useState<Message[]>([])
  const [exclus, setExclus] = useState<Exclu[]>([])
  const [texte, setTexte] = useState('')
  const [versionPhotos, setVersionPhotos] = useState(0)
  const photos = useAvatars(messages.map((m) => m.auteur_id), versionPhotos)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const fin = useRef<HTMLDivElement>(null)
  const dernier = useRef('')

  const lire = useCallback(async () => {
    const { data, error } = await supabase.rpc('club_lire', { p_niveau: estProf ? niveau : null })
    if (error) return
    const liste = (data as Message[]) || []
    const cle = liste.map((m) => m.id).join(',')
    if (cle !== dernier.current) {
      dernier.current = cle
      setMessages(liste)
    }
  }, [estProf, niveau])

  const lireExclus = useCallback(async () => {
    const { data } = await supabase.rpc('prof_club_exclus')
    setExclus((data as Exclu[]) || [])
  }, [])

  useEffect(() => {
    let annule = false
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/connexion')
        return
      }
      const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const { data: st } = await supabase.rpc('club_statut')
      const { data: monNiveau } = await supabase.rpc('club_mon_niveau')
      if (annule) return
      setMoi(user.id)
      const prof = profil?.role === 'professeur'
      setEstProf(prof)
      if (monNiveau) setNiveau(monNiveau as Niveau)
      const s = (st as string) || 'achat'
      setStatut(s === 'ok' || s === 'exclu' || s === 'niveau' ? s : 'achat')
      if (s === 'ok' && prof) await lireExclus()
    }
    init()
    return () => {
      annule = true
    }
  }, [router, lireExclus])

  // Lecture des messages : au chargement, au changement de niveau (professeur), puis toutes les 5 s
  useEffect(() => {
    if (statut !== 'ok') return
    dernier.current = ''
    lire()
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') lire()
    }, 5000)
    return () => clearInterval(t)
  }, [statut, lire])

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function envoyerMessage(contenu: string, piece?: Piece): Promise<boolean> {
    setErreur('')
    setEnvoi(true)
    const { error } = await supabase.rpc('club_envoyer', {
      p_contenu: contenu,
      p_fichier: piece?.path ?? null,
      p_type: piece?.type ?? null,
      p_nom: piece?.nom ?? null,
      p_niveau: estProf ? niveau : null,
    })
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
      if (error.message.includes('retiré')) setStatut('exclu')
      return false
    }
    setTexte('')
    lire()
    return true
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    if (!texte.trim()) return
    await envoyerMessage(texte)
  }

  async function envoyerPiece(piece: Piece) {
    return envoyerMessage(texte, piece)
  }

  async function retirerPhoto(m: Message) {
    if (!window.confirm(`Retirer la photo de ${m.auteur} ?`)) return
    const { error } = await supabase.rpc('prof_retirer_avatar', { p_id: m.auteur_id })
    if (error) {
      setErreur(error.message)
      return
    }
    oublierAvatar(m.auteur_id)
    setVersionPhotos((v) => v + 1)
  }

  async function supprimer(m: Message) {
    if (!confirm('Supprimer ce message ?')) return
    if (!estProf) return // seul le professeur supprime des messages
    const { error } = await supabase.rpc('prof_club_supprimer', { p_id: m.id })
    if (error) setErreur(error.message)
    lire()
  }

  async function exclure(m: Message) {
    const motif = prompt(`Retirer ${m.auteur} du club ?\nMotif (facultatif) :`)
    if (motif === null) return
    const { error } = await supabase.rpc('prof_club_exclure', { p_student: m.auteur_id, p_motif: motif })
    if (error) setErreur(error.message)
    lire()
    lireExclus()
  }

  async function reintegrer(x: Exclu) {
    const { error } = await supabase.rpc('prof_club_reintegrer', { p_student: x.student_id })
    if (error) setErreur(error.message)
    lireExclus()
  }

  if (statut === 'chargement')
    return (
      <p role="status" className="text-center mt-10">
        Chargement...
      </p>
    )

  if (statut === 'niveau')
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Le club</h1>
        <div className="rounded-2xl bg-mist p-5">
          <p className="font-medium">Passe d&apos;abord le test de niveau pour entrer dans le club de ton niveau.</p>
          <Link href="/niveau" className="btn-primary mt-4">
            Passer le test de niveau
          </Link>
        </div>
      </div>
    )

  if (statut !== 'ok')
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Le club</h1>
        <div className="rounded-2xl bg-mist p-5">
          {statut === 'exclu' ? (
            <p className="font-medium">Tu as été retiré du club par le professeur.</p>
          ) : (
            <>
              <p className="font-medium">Le club est réservé aux élèves qui ont acheté au moins un cours.</p>
              <Link href="/cours" className="btn-primary mt-4">
                Voir les cours
              </Link>
            </>
          )}
        </div>
      </div>
    )

  const nomNiveau = NIVEAUX.find((n) => n.code === niveau)?.nom

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 sm:px-5">
      <CarteChat className="h-[calc(100dvh-6.5rem)] min-h-[32rem]">
        <EnteteChat
          avatar={
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-deep">
              <IconeGroupe />
            </span>
          }
          titre={`Le club : niveau ${nomNiveau}`}
          sous="Les élèves de ton niveau et le professeur"
        >
          {estProf && (
            <div role="tablist" aria-label="Niveau du club" className="mt-3 flex flex-wrap gap-2">
              {NIVEAUX.map((n) => (
                <button
                  key={n.code}
                  type="button"
                  role="tab"
                  aria-selected={n.code === niveau}
                  onClick={() => {
                    setMessages([])
                    setNiveau(n.code)
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    n.code === niveau ? 'bg-white text-navy' : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {n.nom}
                </button>
              ))}
            </div>
          )}
        </EnteteChat>
        <PhotoProfil nom="Moi" />

        <div
          role="log"
          aria-live="polite"
          aria-label={`Messages du club ${nomNiveau}`}
          onLoadCapture={() => fin.current?.scrollIntoView({ block: 'end' })}
          className="chat-fond flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4 sm:px-5"
        >
          {messages.length === 0 && (
            <p className="m-auto rounded-2xl bg-white/90 px-4 py-2 text-ardoise-texte shadow-sm ring-1 ring-line">
              Aucun message pour l&apos;instant. Lance la discussion !
            </p>
          )}
          {messages.map((m, i) => {
            const mien = m.auteur_id === moi
            const nouveauJour = i === 0 || cleJour(messages[i - 1].created_at) !== cleJour(m.created_at)
            return (
              <Fragment key={m.id}>
                {nouveauJour && <SeparateurJour iso={m.created_at} />}
                <Bulle
                  mien={mien}
                  auteur={m.auteur}
                  prof={m.est_prof}
                  heure={heureCourte(m.created_at)}
                  avatar={<Avatar nom={m.auteur} src={photos[m.auteur_id]} className="size-8 text-xs" />}
                  actions={
                    estProf && (
                      <>
                        {!mien && !m.est_prof && (
                          <button type="button" onClick={() => exclure(m)} className="bulle-action">
                            Retirer du club
                          </button>
                        )}
                        {!mien && !m.est_prof && photos[m.auteur_id] && (
                          <button type="button" onClick={() => retirerPhoto(m)} className="bulle-action">
                            Retirer la photo
                          </button>
                        )}
                        <button type="button" onClick={() => supprimer(m)} className="bulle-action">
                          Supprimer
                        </button>
                      </>
                    )
                  }
                >
                  {m.fichier_path && m.fichier_type && (
                    <div className="rounded-xl bg-white p-1 text-ink">
                      <PieceAffichee path={m.fichier_path} type={m.fichier_type} nom={m.fichier_nom} />
                    </div>
                  )}
                  {m.contenu && <p className="whitespace-pre-wrap leading-snug">{m.contenu}</p>}
                </Bulle>
              </Fragment>
            )
          })}
          <div ref={fin} />
        </div>

        <form onSubmit={envoyer} className="border-t border-line bg-white px-3 py-3 sm:px-4">
          <label htmlFor="msg-club" className="sr-only">
            Ton message
          </label>
          <BoutonsPieces
            dossier={`club/${niveau}`}
            onPiece={envoyerPiece}
            desactive={envoi}
            champ={
              <textarea
                id="msg-club"
                value={texte}
                onChange={(e) => setTexte(e.target.value.slice(0, MAX))}
                rows={1}
                placeholder="Écris ton message..."
                className="chat-champ"
              />
            }
            envoyer={<BoutonEnvoyer desactive={envoi || !texte.trim()} envoi={envoi} />}
          />
          {texte.length > MAX * 0.8 && (
            <p className="mt-1 text-right text-xs text-ardoise-texte">
              {texte.length} / {MAX}
            </p>
          )}
          {erreur && (
            <p role="alert" className="mt-1 px-2 text-sm font-medium text-red-700">
              {erreur}
            </p>
          )}
        </form>
      </CarteChat>

      {estProf && exclus.length > 0 && (
        <section className="mt-4 rounded-2xl border border-line bg-white p-4">
          <h2 className="font-bold">Élèves retirés du club</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {exclus.map((x) => (
              <li key={x.student_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {x.nom} ({x.email}){x.motif ? ` : ${x.motif}` : ''}
                </span>
                <button type="button" onClick={() => reintegrer(x)} className="rounded border px-3 py-1">
                  Réintégrer
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
