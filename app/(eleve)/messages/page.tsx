'use client'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BoutonsPieces, PieceAffichee } from '@/components/PiecesJointes'
import type { Piece, TypePiece } from '@/lib/pieces-jointes'

type Message = {
  id: string
  sender_role: 'eleve' | 'professeur'
  content: string
  created_at: string
  fichier_path: string | null
  fichier_type: TypePiece | null
  fichier_nom: string | null
}

const MAX = 1000

function heure(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessagesEleve() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [aAchete, setAAchete] = useState(false)
  const [pret, setPret] = useState(false)
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const fin = useRef<HTMLDivElement>(null)
  // Un élève sans cours peut répondre si le professeur lui a écrit en premier
  const peutEcrire = aAchete || messages.some((m) => m.sender_role === 'professeur')

  const rafraichir = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_role, content, created_at, fichier_path, fichier_type, fichier_nom')
      .order('created_at')
    setMessages((data as Message[]) || [])
    await supabase.rpc('mark_read')
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
      const { data: achats } = await supabase.from('purchases').select('id').eq('status', 'valide').limit(1)
      await rafraichir()
      if (annule) return
      setUserId(user.id)
      setAAchete(!!achats && achats.length > 0)
      setPret(true)
    }
    init()
    const t = setInterval(rafraichir, 15000)
    return () => {
      annule = true
      clearInterval(t)
    }
  }, [router, rafraichir])

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function envoyerMessage(contenu: string, piece?: Piece): Promise<boolean> {
    if (!userId) return false
    setErreur('')
    setEnvoi(true)
    const { error } = await supabase.from('messages').insert({
      student_id: userId,
      sender_role: 'eleve',
      content: contenu.trim(),
      ...(piece ? { fichier_path: piece.path, fichier_type: piece.type, fichier_nom: piece.nom } : {}),
    })
    setEnvoi(false)
    if (error) {
      setErreur(
        error.message.includes('beaucoup')
          ? error.message
          : 'Ton message n’a pas pu être envoyé. Réessaie dans un instant.'
      )
      return false
    }
    setTexte('')
    rafraichir()
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

  if (!pret) {
    return (
      <p role="status" className="mx-auto mt-16 max-w-2xl px-5 text-center text-lg">
        Chargement...
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
      <p className="mt-2 text-ink/80">Ta conversation avec le professeur.</p>

      {!peutEcrire && messages.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-mist p-6">
          <p className="font-medium">La messagerie est réservée aux élèves qui ont acheté un cours.</p>
          <Link href="/cours" className="btn-primary mt-4">
            Voir les cours
          </Link>
        </div>
      ) : (
        <>
          <div
            className="mt-6 flex max-h-[28rem] min-h-40 flex-col gap-3 overflow-y-auto rounded-2xl p-4 ring-1 ring-line"
            aria-live="polite"
          >
            {messages.length === 0 && <p className="text-ink/70">Aucun message pour l&apos;instant. Écris au professeur ci-dessous.</p>}
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender_role === 'eleve' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`flex max-w-[85%] flex-col gap-2 break-words rounded-2xl px-4 py-2 ${
                    m.sender_role === 'eleve' ? 'bg-navy text-white' : 'bg-mist'
                  }`}
                >
                  <span className="sr-only">{m.sender_role === 'eleve' ? 'Toi : ' : 'Professeur : '}</span>
                  {m.fichier_path && m.fichier_type && (
                    <div className="rounded-xl bg-white p-1 text-ink">
                      <PieceAffichee path={m.fichier_path} type={m.fichier_type} nom={m.fichier_nom} />
                    </div>
                  )}
                  {m.content && <p className="whitespace-pre-line">{m.content}</p>}
                </div>
                <p className="mt-1 text-xs text-ink/60">{heure(m.created_at)}</p>
              </div>
            ))}
            <div ref={fin} />
          </div>

          {peutEcrire ? (
            <form onSubmit={envoyer} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 font-medium">
                Ton message
                <textarea
                  value={texte}
                  onChange={(e) => setTexte(e.target.value)}
                  maxLength={MAX}
                  rows={3}
                  className="rounded-xl border-2 border-line px-3 py-2 text-base"
                />
              </label>
              <p className="text-sm text-ink/70">
                {texte.length} / {MAX}
              </p>
              {erreur && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
                  {erreur}
                </p>
              )}
              <BoutonsPieces dossier={`messages/${userId}`} onPiece={envoyerPiece} desactive={envoi} />
              <button type="submit" disabled={envoi || !texte.trim()} className="btn-primary w-fit disabled:opacity-50">
                {envoi ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          ) : (
            <p className="mt-4 rounded-2xl bg-mist p-4">Tu ne peux pas écrire pour l’instant.</p>
          )}
        </>
      )}
    </div>
  )
}
