'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { composerTelephone } from '@/lib/telephone'
import { PAYS, drapeau } from '@/lib/pays'

export default function Inscription() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [indicatif, setIndicatif] = useState('')
  const [telephone, setTelephone] = useState('')
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
    setEnvoi(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, telephone: tel } },
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

  const champ = 'rounded-xl border-2 border-line px-4 py-3 text-base'

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-4 px-5 pb-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Créer un compte</h1>
      <label className="flex flex-col gap-1 font-medium">
        Nom complet
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={champ} required />
      </label>
      <div role="group" aria-labelledby="lib-tel" className="flex flex-col gap-1 font-medium">
        <span id="lib-tel">Numéro WhatsApp</span>
        <div className="flex gap-2">
          <select
            value={indicatif}
            onChange={(e) => setIndicatif(e.target.value)}
            aria-label="Pays"
            className={`${champ} w-40 shrink-0 px-2`}
            required
          >
            <option value="" disabled>
              Choisis ton pays
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
            aria-label="Numéro de téléphone"
            className={`${champ} min-w-0 flex-1`}
            required
            aria-describedby="aide-tel"
          />
        </div>
        <span id="aide-tel" className="text-sm font-normal text-ink/70">
          Choisis ton pays, puis écris ton numéro. L’équipe ClicAnglais l’utilisera pour te contacter.
        </span>
      </div>
      <label className="flex flex-col gap-1 font-medium">
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={champ} required />
      </label>
      <label className="flex flex-col gap-1 font-medium">
        Mot de passe
        <input
          type="password"
          value={password}
          minLength={6}
          onChange={(e) => setPassword(e.target.value)}
          className={champ}
          required
        />
      </label>
      {erreur && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-red-800">
          {erreur}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl bg-mist p-3 font-medium">
          {message}
        </p>
      )}
      <p className="text-sm">
        En créant un compte, tu acceptes les{' '}
        <Link href="/cgu" className="font-bold underline">
          conditions d’utilisation
        </Link>{' '}
        et la{' '}
        <Link href="/confidentialite" className="font-bold underline">
          politique de confidentialité
        </Link>
        .
      </p>
      <button type="submit" disabled={envoi} className="btn-primary disabled:opacity-50">
        {envoi ? 'Création...' : 'S’inscrire'}
      </button>
      <p>
        Tu as déjà un compte ?{' '}
        <Link href="/connexion" className="font-bold underline">
          Se connecter
        </Link>
      </p>
    </form>
  )
}
