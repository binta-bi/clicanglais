import type { Metadata } from 'next'
import PageLegale from '@/components/PageLegale'
import { LEGAL } from '@/lib/legal'

export const metadata: Metadata = { title: 'Confidentialité – ClicAnglais' }

export default function PageConfidentialite() {
  return (
    <PageLegale titre="Politique de confidentialité" miseAJour={LEGAL.miseAJour}>
      <section>
        <p>
          Cette page explique quelles données {LEGAL.nomSite} garde sur toi, pourquoi, et qui peut les voir. Le
          responsable du site est {LEGAL.editeur} ({LEGAL.email}).
        </p>
      </section>

      <section>
        <h2>Les données que nous gardons</h2>
        <ul>
          <li>Ton nom et ton adresse email, donnés à l’inscription.</li>
          <li>Ton mot de passe, gardé sous forme chiffrée : nous ne pouvons pas le lire.</li>
          <li>Ton niveau et tes résultats aux tests de niveau (réponses, score, date).</li>
          <li>Tes commandes et les cours que tu as achetés (cours, montant, date).</li>
          <li>Tes messages au professeur et les avis que tu publies.</li>
        </ul>
      </section>

      <section>
        <h2>Pourquoi nous les utilisons</h2>
        <ul>
          <li>Créer ton compte et te permettre de te connecter.</li>
          <li>Te donner accès aux cours que tu as achetés, y compris les liens des cours en direct.</li>
          <li>Te proposer le bon niveau grâce aux tests.</li>
          <li>Permettre au professeur de suivre les inscriptions, les achats et de te répondre.</li>
        </ul>
        <p>Nous ne vendons pas tes données et nous ne les utilisons pas pour de la publicité.</p>
      </section>

      <section>
        <h2>Qui peut les voir</h2>
        <ul>
          <li>Toi, pour ton propre compte.</li>
          <li>Le professeur, pour gérer la plateforme (élèves, achats, résultats, messages).</li>
          <li>
            Nos prestataires techniques, qui font fonctionner le site : Supabase (base de données et connexion),
            Vercel (hébergement du site) et Wave (paiement). Wave traite ton paiement : nous ne recevons ni ton code
            secret ni tes identifiants Wave.
          </li>
          <li>Les autres élèves ne voient pas tes données. Ton nom peut apparaître à côté d’un avis que tu publies.</li>
        </ul>
      </section>

      <section>
        <h2>Combien de temps nous les gardons</h2>
        <p>
          Nous gardons tes données tant que ton compte existe. Tu peux demander leur suppression en écrivant à{' '}
          {LEGAL.email}. Certaines informations de paiement peuvent être conservées plus longtemps si la loi ou la
          comptabilité l’exigent.
        </p>
      </section>

      <section>
        <h2>Tes droits</h2>
        <p>
          Tu peux demander à voir, corriger ou supprimer tes données. Écris-nous à {LEGAL.email} depuis l’adresse
          email de ton compte.
        </p>
      </section>

      <section>
        <h2>Cookies et stockage</h2>
        <p>
          Le site garde sur ton appareil uniquement ce qui sert à te garder connecté. Nous n’utilisons pas de cookies
          publicitaires.
        </p>
      </section>

      <section>
        <h2>Changements</h2>
        <p>La date de mise à jour est indiquée en haut de cette page.</p>
      </section>
    </PageLegale>
  )
}
