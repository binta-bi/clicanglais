'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { composerTelephone } from '@/lib/telephone'
import { PAYS, drapeau } from '@/lib/pays'
import { AuthCarte, AuthShell, AuthTitre, Champ, ChampMotDePasse, MessageErreur } from '@/components/AuthShell'

export default function Inscription() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [indicatif, setIndicatif] = useState('')
  const [telephone, setTelephone] = useState('')
  const [accepte, setAccepte] = useState(false)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setMessage('')
    const pays = PAYS.find((p) => p.iso === indicatif)
    if (!pays) {
      setErreur('Choisis ton pays dans la liste avant d’écrire ton numéro.')
      return
    }
    const tel = composerTelephone(pays.indicatif, telephone)
    if (!tel) {
      setErreur('Numéro WhatsApp invalide. Choisis ton pays et écris ton numéro.')
      return
    }
    if (!accepte) {
      setErreur('Pour créer ton compte, coche la case d’acceptation des conditions d’utilisation.')
      return
    }
    setEnvoi(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, telephone: tel, cgu_acceptees_le: new Date().toISOString() } },
    })
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
    } else if (!data.session) {
      setMessage('Compte créé. Vérifie ta boîte email pour confirmer ton adresse, puis connecte-toi.')
    } else {
      router.push('/niveau')
    }
  }

  return (
    <AuthShell
      photo="/niveau-debutant.jpg"
      titre="Commence ton anglais dès aujourd’hui"
      accroche="Quelques minutes suffisent pour créer ton compte."
      puces={['Crée ton compte', 'Choisis ton niveau : test ou Débutant', 'Rejoins les cours en direct et le club']}
    >
      <AuthCarte>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthTitre titre="Créer un compte" />
          <Champ id="nom" label="Nom complet">
            <input
              id="nom"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="champ-auth"
              required
            />
          </Champ>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tel" className="text-sm font-semibold text-nuit">
              Numéro WhatsApp
            </label>
            <div className="flex gap-2">
              <select
                value={indicatif}
                onChange={(e) => setIndicatif(e.target.value)}
                aria-label="Pays"
                className="champ-auth w-[8.5rem] min-w-0 shrink-0 !px-2 sm:w-40"
                required
              >
                <option value="" disabled>
                  Pays
                </option>
                {PAYS.map((p) => (
                  <option key={p.iso} value={p.iso}>
                    {drapeau(p.iso)} +{p.indicatif} {p.nom}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="00 00 00 00 00"
                id="tel"
                aria-label="Numéro WhatsApp (numéro de téléphone)"
                className="champ-auth min-w-0 flex-1"
                required
                aria-describedby="aide-tel"
              />
            </div>
            <span id="aide-tel" className="text-sm text-ardoise-texte">
              Choisis ton pays, puis écris ton numéro. L’équipe ClicAnglais l’utilisera pour te contacter.
            </span>
          </div>
          <Champ id="email" label="Email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="champ-auth"
              required
            />
          </Champ>
          <Champ id="mdp" label="Mot de passe" aide="6 caractères minimum.">
            <ChampMotDePasse id="mdp" value={password} onChange={setPassword} minLength={6} autoComplete="new-password" />
          </Champ>
          {erreur && <MessageErreur>{erreur}</MessageErreur>}
          {message && (
            <p role="status" className="rounded-xl bg-mist p-3 text-sm font-medium ring-1 ring-line">
              {message}
            </p>
          )}
          <label className="flex items-start gap-3 rounded-xl bg-ivoire p-3 text-sm leading-snug ring-1 ring-nuit/10">
            <input
              type="checkbox"
              checked={accepte}
              onChange={(e) => setAccepte(e.target.checked)}
              required
              className="mt-0.5 size-5 shrink-0 accent-[#244b78]"
            />
            <span>
              J’accepte les{' '}
              <Link href="/cgu" target="_blank" className="font-bold text-royal underline">
                conditions d’utilisation
              </Link>{' '}
              et la{' '}
              <Link href="/confidentialite" target="_blank" className="font-bold text-royal underline">
                politique de confidentialité
              </Link>
              .
            </span>
          </label>
          <button type="submit" disabled={envoi} className="btn-hero w-full">
            {envoi ? 'Création...' : 'S’inscrire'}
          </button>
        </form>
        <p className="mt-6 border-t border-line pt-5 text-center text-ardoise-texte">
          Tu as déjà un compte ?{' '}
          <Link href="/connexion" className="font-bold text-royal underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </p>
      </AuthCarte>
    </AuthShell>
  )
}
