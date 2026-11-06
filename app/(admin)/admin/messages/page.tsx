'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BoutonsPieces, PieceAffichee } from '@/components/PiecesJointes'
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

function heure(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

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

  async function envoyerMessage(contenu: string, piece?: Piece) {
    if (!choisi) return
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
      return
    }
    setTexte('')
    chargerFil(choisi)
    chargerListe()
  }

  async function repondre(e: React.FormEvent) {
    e.preventDefault()
    if (!texte.trim()) return
    await envoyerMessage(texte)
  }

  async function envoyerPiece(piece: Piece) {
    await envoyerMessage(texte, piece)
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button
          type="button"
          onClick={() => (nouveau ? setNouveau(false) : ouvrirNouveau())}
          aria-expanded={nouveau}
          className="rounded bg-[#2d3a6b] px-4 py-2 text-sm text-white"
        >
          {nouveau ? 'Fermer' : 'Nouveau message'}
        </button>
      </div>
      {nouveau && (
        <section aria-labelledby="nv-titre" className="flex flex-col gap-2 rounded border p-4">
          <h2 id="nv-titre" className="font-bold">Écrire à un inscrit</h2>
          <label className="flex flex-col gap-1 text-sm">
            Chercher par nom, email ou numéro
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full max-w-md rounded border p-2"
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
                  className="w-full rounded border p-2 text-left text-sm"
                >
                  <strong>{i.nom}</strong>
                  <span className="block break-all text-gray-500">
                    {i.email} · {i.nb_achats > 0 ? 'Élève' : 'Inscrit (sans accès)'}
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

      <div className="grid gap-4 md:grid-cols-3">
        <ul className={`flex flex-col gap-2 ${choisi ? 'hidden md:flex' : ''}`}>
          {conversations.map((c) => (
            <li key={c.student_id}>
              <button
                onClick={() => ouvrir(c.student_id, c.full_name || '')}
                aria-current={c.student_id === choisi}
                className={`w-full rounded border p-3 text-left ${c.student_id === choisi ? 'border-[#2d3a6b] bg-gray-50' : ''}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <strong>{c.full_name || 'Élève'}</strong>
                  {c.unread > 0 && (
                    <span className="rounded-full bg-[#e8652d] px-2 text-xs font-bold text-white">
                      {c.unread}
                      <span className="sr-only"> non lus</span>
                    </span>
                  )}
                </span>
                <span className="mt-1 block truncate text-sm text-gray-500">
                  {c.last_sender === 'professeur' ? 'Toi : ' : ''}
                  {c.last_content || '📎 Pièce jointe'}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {choisi && (
          <div className="flex flex-col gap-3 md:col-span-2">
            <button onClick={() => setChoisi(null)} className="w-fit text-sm text-[#2d3a6b] md:hidden">
              ← Toutes les conversations
            </button>
            <h2 className="text-lg font-bold">{eleve?.full_name || nomChoisi || 'Élève'}</h2>
            <div className="flex max-h-[28rem] min-h-40 flex-col gap-3 overflow-y-auto rounded border p-4" aria-live="polite">
              {messages.length === 0 && <p className="text-gray-500">Aucun message. Écris le premier ci-dessous.</p>}
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.sender_role === 'professeur' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`flex max-w-[85%] flex-col gap-2 break-words rounded-2xl px-4 py-2 ${
                      m.sender_role === 'professeur' ? 'bg-[#2d3a6b] text-white' : 'bg-gray-100'
                    }`}
                  >
                    {m.fichier_path && m.fichier_type && (
                      <div className="rounded-xl bg-white p-1 text-black">
                        <PieceAffichee path={m.fichier_path} type={m.fichier_type} nom={m.fichier_nom} />
                      </div>
                    )}
                    {m.content && <p className="whitespace-pre-line">{m.content}</p>}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{heure(m.created_at)}</p>
                </div>
              ))}
              <div ref={fin} />
            </div>
            <form onSubmit={repondre} className="flex flex-col gap-2">
              <label className="flex flex-col gap-1 text-sm">
                Ton message
                <textarea
                  value={texte}
                  onChange={(e) => setTexte(e.target.value)}
                  maxLength={MAX}
                  rows={3}
                  className="rounded border p-2"
                />
              </label>
              <BoutonsPieces dossier={`messages/${choisi}`} onPiece={envoyerPiece} desactive={envoi} />
              <button
                type="submit"
                disabled={envoi || !texte.trim()}
                className="w-fit rounded bg-[#2d3a6b] px-4 py-2 text-white disabled:opacity-50"
              >
                {envoi ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
