'use client'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BoutonsPieces, PieceAffichee } from '@/components/PiecesJointes'
import { useAvatars } from '@/lib/avatars'
import { Avatar, BoutonEnvoyer, Bulle, CarteChat, EnteteChat, IconeFleche, SeparateurJour, cleJour, heureCourte } from '@/components/ChatUI'
import type { Piece, TypePiece } from '@/lib/pieces-jointes'

type Conversation = {
  student_id: string
  full_name: string | null
  last_content: string
  last_at: string
  last_sender: 'eleve' | 'professeur'
  unread: number
}
type Message = {
  id: string
  sender_role: 'eleve' | 'professeur'
  content: string
  created_at: string
  fichier_path: string | null
  fichier_type: TypePiece | null
  fichier_nom: string | null
}

type Inscrit = { id: string; nom: string; email: string; telephone: string | null; nb_achats: number }

const MAX = 1000

export default function AdminMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [choisi, setChoisi] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [texte, setTexte] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [pret, setPret] = useState(false)
  const [nomChoisi, setNomChoisi] = useState('')
  const [nouveau, setNouveau] = useState(false)
  const [inscrits, setInscrits] = useState<Inscrit[]>([])
  const [recherche, setRecherche] = useState('')
  const fin = useRef<HTMLDivElement>(null)

  const chargerListe = useCallback(async () => {
    const { data, error } = await supabase.rpc('conversations')
    if (error) setErreur(error.message)
    setConversations((data as Conversation[]) || [])
    setPret(true)
  }, [])

  const chargerFil = useCallback(
    async (studentId: string) => {
      const { data } = await supabase
        .from('messages')
        .select('id, sender_role, content, created_at, fichier_path, fichier_type, fichier_nom')
        .eq('student_id', studentId)
        .order('created_at')
      setMessages((data as Message[]) || [])
      await supabase.rpc('mark_read', { p_student: studentId })
    },
    []
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    chargerListe()
    const t = setInterval(() => {
      chargerListe()
      if (choisi) chargerFil(choisi)
    }, 15000)
    return () => clearInterval(t)
  }, [chargerListe, chargerFil, choisi])

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function ouvrirNouveau() {
    setNouveau(true)
    if (inscrits.length === 0) {
      const { data, error } = await supabase.rpc('prof_eleves')
      if (error) setErreur(error.message)
      setInscrits((data as Inscrit[]) || [])
    }
  }

  async function ouvrir(studentId: string, nom = '') {
    setNouveau(false)
    setRecherche('')
    setNomChoisi(nom)
    setChoisi(studentId)
    setErreur('')
    setMessages([])
    await chargerFil(studentId)
    chargerListe()
  }

  async function envoyerMessage(contenu: string, piece?: Piece): Promise<boolean> {
    if (!choisi) return false
    setErreur('')
    setEnvoi(true)
    const { error } = await supabase.from('messages').insert({
      student_id: choisi,
      sender_role: 'professeur',
      content: contenu.trim(),
      ...(piece ? { fichier_path: piece.path, fichier_type: piece.type, fichier_nom: piece.nom } : {}),
    })
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
      return false
    }
    setTexte('')
    chargerFil(choisi)
    chargerListe()
    return true
  }

  async function supprimerMessage(m: Message) {
    if (!choisi) return
    if (!window.confirm('Supprimer ce message ? Il disparaîtra aussi chez l’élève.')) return
    setErreur('')
    const { error } = await supabase.rpc('prof_message_supprimer', { p_id: m.id })
    if (error) {
      setErreur(error.message)
      return
    }
    chargerFil(choisi)
    chargerListe()
  }

  async function repondre(e: React.FormEvent) {
    e.preventDefault()
    if (!texte.trim()) return
    await envoyerMessage(texte)
  }

  async function envoyerPiece(piece: Piece) {
    return envoyerMessage(texte, piece)
  }

  const eleve = conversations.find((c) => c.student_id === choisi)
  const q = recherche.trim().toLowerCase()
  const trouves = q
    ? inscrits
        .filter(
          (i) =>
            i.nom.toLowerCase().includes(q) ||
            i.email.toLowerCase().includes(q) ||
            (i.telephone || '').includes(q.replace(/[\s().-]/g, ''))
        )
        .slice(0, 8)
    : []

  const nomAffiche = eleve?.full_name || nomChoisi || 'Élève'
  const photos = useAvatars([...conversations.map((c) => c.student_id), ...inscrits.map((i) => i.id), ...(choisi ? [choisi] : [])])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button
          type="button"
          onClick={() => (nouveau ? setNouveau(false) : ouvrirNouveau())}
          aria-expanded={nouveau}
          className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-royal"
        >
          {nouveau ? 'Fermer' : 'Nouveau message'}
        </button>
      </div>
      {nouveau && (
        <section aria-labelledby="nv-titre" className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
          <h2 id="nv-titre" className="font-bold">Écrire à un inscrit</h2>
          <label className="flex flex-col gap-1 text-sm">
            Chercher par nom, email ou numéro
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full max-w-md rounded-xl border border-line p-2.5"
              autoFocus
            />
          </label>
          {q && trouves.length === 0 && <p className="text-sm text-gray-500">Aucun inscrit trouvé.</p>}
          <ul className="flex flex-col gap-2">
            {trouves.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => ouvrir(i.id, i.nom)}
                  className="flex w-full items-center gap-3 rounded-xl border border-line p-2.5 text-left text-sm hover:bg-mist"
                >
                  <Avatar nom={i.nom} src={photos[i.id]} className="size-9 text-sm" />
                  <span className="min-w-0">
                    <strong>{i.nom}</strong>
                    <span className="block break-all text-gray-500">
                      {i.email} · {i.nb_achats > 0 ? 'Élève' : 'Inscrit (sans accès)'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
      {pret && conversations.length === 0 && !choisi && <p className="text-gray-500">Aucun message pour l&apos;instant.</p>}

      <div className="grid gap-4 md:grid-cols-[20rem_1fr]">
        <ul className={`flex flex-col gap-1.5 ${choisi ? 'hidden md:flex' : ''}`}>
          {conversations.map((c) => (
            <li key={c.student_id}>
              <button
                onClick={() => ouvrir(c.student_id, c.full_name || '')}
                aria-current={c.student_id === choisi}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 transition-colors ${
                  c.student_id === choisi ? 'bg-mist ring-navy' : 'bg-white ring-line hover:bg-mist'
                }`}
              >
                <Avatar nom={c.full_name || 'Élève'} src={photos[c.student_id]} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <strong className="truncate">{c.full_name || 'Élève'}</strong>
                    {c.unread > 0 && (
                      <span className="rounded-full bg-brand-deep px-2 py-0.5 text-xs font-bold text-white">
                        {c.unread}
                        <span className="sr-only"> non lus</span>
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-ardoise-texte">
                    {c.last_sender === 'professeur' ? 'Toi : ' : ''}
                    {c.last_content || '📎 Pièce jointe'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {choisi && (
          <CarteChat className="h-[75dvh] min-h-[30rem]">
            <EnteteChat
              h2
              avatar={<Avatar nom={nomAffiche} src={choisi ? photos[choisi] : null} />}
              titre={nomAffiche}
              sous="Conversation privée"
              gauche={
                <button
                  type="button"
                  onClick={() => setChoisi(null)}
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/25 md:hidden"
                >
                  <IconeFleche />
                  <span className="sr-only">Toutes les conversations</span>
                </button>
              }
            />
            <div aria-live="polite" onLoadCapture={() => fin.current?.scrollIntoView({ block: 'end' })} className="chat-fond flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4 sm:px-5">
              {messages.length === 0 && (
                <p className="m-auto rounded-2xl bg-white/90 px-4 py-2 text-ardoise-texte shadow-sm ring-1 ring-line">
                  Aucun message. Écris le premier ci-dessous.
                </p>
              )}
              {messages.map((m, i) => {
                const mien = m.sender_role === 'professeur'
                const nouveauJour = i === 0 || cleJour(messages[i - 1].created_at) !== cleJour(m.created_at)
                return (
                  <Fragment key={m.id}>
                    {nouveauJour && <SeparateurJour iso={m.created_at} />}
                    <Bulle
                      mien={mien}
                      auteur={mien ? undefined : nomAffiche}
                      avatar={<Avatar nom={nomAffiche} src={choisi ? photos[choisi] : null} className="size-8 text-xs" />}
                      heure={heureCourte(m.created_at)}
                      actions={
                        <button type="button" onClick={() => supprimerMessage(m)} className="bulle-action">
                          Supprimer<span className="sr-only"> ce message</span>
                        </button>
                      }
                    >
                      {m.fichier_path && m.fichier_type && (
                        <div className="rounded-xl bg-white p-1 text-ink">
                          <PieceAffichee path={m.fichier_path} type={m.fichier_type} nom={m.fichier_nom} />
                        </div>
                      )}
                      {m.content && <p className="whitespace-pre-line leading-snug">{m.content}</p>}
                    </Bulle>
                  </Fragment>
                )
              })}
              <div ref={fin} />
            </div>
            <form onSubmit={repondre} className="border-t border-line bg-white px-3 py-3 sm:px-4">
              <label htmlFor="msg-admin" className="sr-only">
                Ton message
              </label>
              <BoutonsPieces
                dossier={`messages/${choisi}`}
                onPiece={envoyerPiece}
                desactive={envoi}
                champ={
                  <textarea
                    id="msg-admin"
                    value={texte}
                    onChange={(e) => setTexte(e.target.value)}
                    maxLength={MAX}
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
            </form>
          </CarteChat>
        )}
      </div>
    </div>
  )
}
