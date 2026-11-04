'use client'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BoutonsPieces, PieceAffichee } from '@/components/PiecesJointes'
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

function heure(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Club() {
  const router = useRouter()
  const [statut, setStatut] = useState<Statut>('chargement')
  const [moi, setMoi] = useState('')
  const [estProf, setEstProf] = useState(false)
  const [niveau, setNiveau] = useState<Niveau>('debutant')
  const [messages, setMessages] = useState<Message[]>([])
  const [exclus, setExclus] = useState<Exclu[]>([])
  const [texte, setTexte] = useState('')
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

  async function envoyerMessage(contenu: string, piece?: Piece) {
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
      return
    }
    setTexte('')
    lire()
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    if (!texte.trim()) return
    await envoyerMessage(texte)
  }

  async function envoyerPiece(piece: Piece) {
    await envoyerMessage(texte, piece)
  }

  async function supprimer(m: Message) {
    if (!confirm('Supprimer ce message ?')) return
    const { error } = estProf
      ? await supabase.rpc('prof_club_supprimer', { p_id: m.id })
      : await supabase.rpc('club_supprimer_le_mien', { p_id: m.id })
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

  return (
    <div className="max-w-2xl mx-auto mt-6 px-4 pb-10 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Le club : niveau {NIVEAUX.find((n) => n.code === niveau)?.nom}</h1>
      {estProf && (
        <div role="tablist" aria-label="Niveau du club" className="flex flex-wrap gap-2">
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
              className={`rounded-xl border px-4 py-2 text-sm font-medium ${n.code === niveau ? 'bg-brand-deep text-white' : ''}`}
            >
              {n.nom}
            </button>
          ))}
        </div>
      )}
      <p className="text-sm text-gray-600">
        Échange avec les autres élèves de ton niveau et le professeur. Reste poli et ne partage pas d&apos;informations
        personnelles (numéro de téléphone, mot de passe).
      </p>

      <div
        role="log"
        aria-live="polite"
        aria-label={`Messages du club ${NIVEAUX.find((n) => n.code === niveau)?.nom}`}
        className="border rounded-2xl p-3 h-[55vh] overflow-y-auto flex flex-col gap-3"
      >
        {messages.length === 0 && <p className="text-gray-500 m-auto">Aucun message pour l&apos;instant. Lance la discussion !</p>}
        {messages.map((m) => {
          const mien = m.auteur_id === moi
          return (
            <div key={m.id} className={`flex flex-col max-w-[85%] ${mien ? 'self-end items-end' : 'self-start items-start'}`}>
              <p className="text-xs text-gray-500">
                <span className="font-bold text-gray-800">{m.auteur}</span>
                {m.est_prof && <span className="ml-1 rounded bg-brand-deep px-1.5 py-0.5 text-white">Professeur</span>}
                {' · '}
                {heure(m.created_at)}
              </p>
              <div className={`mt-1 flex flex-col gap-2 rounded-2xl px-3 py-2 break-words ${mien ? 'bg-mist' : 'border'}`}>
                {m.fichier_path && m.fichier_type && (
                  <PieceAffichee path={m.fichier_path} type={m.fichier_type} nom={m.fichier_nom} />
                )}
                {m.contenu && <p className="whitespace-pre-wrap">{m.contenu}</p>}
              </div>
              <div className="mt-1 flex gap-3 text-xs">
                {(mien || estProf) && (
                  <button type="button" onClick={() => supprimer(m)} className="text-red-700 underline">
                    Supprimer
                  </button>
                )}
                {estProf && !mien && !m.est_prof && (
                  <button type="button" onClick={() => exclure(m)} className="text-red-700 underline">
                    Retirer du club
                  </button>
                )}
              </div>
            </div>
          )
        })}
        <div ref={fin} />
      </div>

      <form onSubmit={envoyer} className="flex flex-col gap-2">
        <label htmlFor="msg-club" className="sr-only">
          Ton message
        </label>
        <textarea
          id="msg-club"
          value={texte}
          onChange={(e) => setTexte(e.target.value.slice(0, MAX))}
          rows={2}
          placeholder="Écris ton message..."
          className="border p-3 rounded-xl"
        />
        <BoutonsPieces dossier={`club/${niveau}`} onPiece={envoyerPiece} desactive={envoi} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500">
            {texte.length} / {MAX}
          </span>
          <button type="submit" disabled={envoi || !texte.trim()} className="btn-primary disabled:opacity-50">
            {envoi ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
        {erreur && (
          <p role="alert" className="text-red-700 text-sm">
            {erreur}
          </p>
        )}
      </form>

      {estProf && exclus.length > 0 && (
        <section className="rounded-2xl border p-4">
          <h2 className="font-bold">Élèves retirés du club</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {exclus.map((x) => (
              <li key={x.student_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {x.nom} ({x.email}){x.motif ? ` : ${x.motif}` : ''}
                </span>
                <button type="button" onClick={() => reintegrer(x)} className="border px-3 py-1 rounded">
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
