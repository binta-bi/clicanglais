'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AuthCarte, AuthShell, AuthTitre, Champ, ChampMotDePasse, MessageErreur } from '@/components/AuthShell'

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      setErreur(error?.message ?? 'Connexion impossible.')
      setEnvoi(false)
      return
    }
    // Le professeur va dans son espace ; un élève sans niveau choisit son point de départ
    const { data: profil } = await supabase
      .from('profiles')
      .select('role, niveau')
      .eq('id', data.user.id)
      .single()
    router.push(profil?.role === 'professeur' ? '/admin' : profil?.niveau ? '/mes-cours' : '/niveau')
  }

  return (
    <AuthShell
      photo="/apprenant.jpg"
      titre="Content de te revoir"
      accroche="Retrouve tes cours, tes replays et le club de ton niveau."
      puces={['Cours en direct de 20h à 21h30', 'Replay de chaque séance', 'Le club pour pratiquer avec les autres élèves']}
    >
      <AuthCarte>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthTitre titre="Se connecter" sous="Entre tes identifiants pour accéder à ton espace." />
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
          <Champ id="mdp" label="Mot de passe">
            <ChampMotDePasse id="mdp" value={password} onChange={setPassword} autoComplete="current-password" />
          </Champ>
          {erreur && <MessageErreur>{erreur}</MessageErreur>}
          <button type="submit" disabled={envoi} className="btn-hero w-full">
            {envoi ? 'Connexion...' : 'Se connecter'}
          </button>
          <Link href="/mot-de-passe-oublie" className="text-center text-sm font-semibold text-royal underline-offset-4 hover:underline">
            Mot de passe oublié ?
          </Link>
        </form>
        <p className="mt-6 border-t border-line pt-5 text-center text-ardoise-texte">
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="font-bold text-royal underline-offset-4 hover:underline">
            S’inscrire
          </Link>
        </p>
      </AuthCarte>
    </AuthShell>
  )
}
