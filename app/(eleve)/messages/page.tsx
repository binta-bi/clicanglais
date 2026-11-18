'use client'
import Link from 'next/link'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BoutonsPieces, PieceAffichee } from '@/components/PiecesJointes'
import { Avatar, BoutonEnvoyer, Bulle, CarteChat, EnteteChat, SeparateurJour, cleJour, heureCourte } from '@/components/ChatUI'
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
    <div className="mx-auto max-w-3xl px-3 py-4 sm:px-5">
      {!peutEcrire && messages.length === 0 ? (
        <div className="px-2 py-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
          <p className="mt-2 text-ink/80">Ta conversation avec le professeur.</p>
          <div className="mt-8 rounded-2xl bg-mist p-6">
            <p className="font-medium">La messagerie est réservée aux élèves qui ont acheté un cours.</p>
            <Link href="/cours" className="btn-primary mt-4">
              Voir les cours
            </Link>
          </div>
        </div>
      ) : (
        <CarteChat className="h-[calc(100dvh-6.5rem)] min-h-[32rem]">
          <EnteteChat avatar={<Avatar nom="Professeur" />} titre="Messages" sous="Ta conversation avec le professeur" />

          <div aria-live="polite" onLoadCapture={() => fin.current?.scrollIntoView({ block: 'end' })} className="chat-fond flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4 sm:px-5">
            {messages.length === 0 && (
              <p className="m-auto rounded-2xl bg-white/90 px-4 py-2 text-ardoise-texte shadow-sm ring-1 ring-line">
                Aucun message pour l&apos;instant. Écris au professeur ci-dessous.
              </p>
            )}
            {messages.map((m, i) => {
              const mien = m.sender_role === 'eleve'
              const nouveauJour = i === 0 || cleJour(messages[i - 1].created_at) !== cleJour(m.created_at)
              return (
                <Fragment key={m.id}>
                  {nouveauJour && <SeparateurJour iso={m.created_at} />}
                  <Bulle mien={mien} auteur={mien ? undefined : 'Professeur'} heure={heureCourte(m.created_at)}>
                    <span className="sr-only">{mien ? 'Toi : ' : 'Professeur : '}</span>
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

          {peutEcrire ? (
            <form onSubmit={envoyer} className="border-t border-line bg-white px-3 py-3 sm:px-4">
              <label htmlFor="msg-prive" className="sr-only">
                Ton message
              </label>
              <BoutonsPieces
                dossier={`messages/${userId}`}
                onPiece={envoyerPiece}
                desactive={envoi}
                champ={
                  <textarea
                    id="msg-prive"
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
              {erreur && (
                <p role="alert" className="mt-1 px-2 text-sm font-medium text-red-700">
                  {erreur}
                </p>
              )}
            </form>
          ) : (
            <p className="border-t border-line bg-white p-4 text-ardoise-texte">Tu ne peux pas écrire pour l’instant.</p>
          )}
        </CarteChat>
      )}
    </div>
  )
}
