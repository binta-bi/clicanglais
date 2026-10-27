import type { Metadata } from 'next'
import PageLegale from '@/components/PageLegale'
import { LEGAL } from '@/lib/legal'

export const metadata: Metadata = { title: 'Conditions d’utilisation – ClicAnglais' }

export default function PageCgu() {
  return (
    <PageLegale titre="Conditions générales d’utilisation" miseAJour={LEGAL.miseAJour}>
      <section>
        <h2>1. Qui sommes-nous ?</h2>
        <p>
          {LEGAL.nomSite} est une plateforme de cours d’anglais en ligne éditée par {LEGAL.editeur}. Pour toute
          question : {LEGAL.email}.
        </p>
      </section>

      <section>
        <h2>2. Ton compte</h2>
        <ul>
          <li>Pour acheter un cours, tu dois créer un compte avec une adresse email valide.</li>
          <li>Ton compte est personnel. Tu ne le partages pas et tu gardes ton mot de passe secret.</li>
          <li>Tu es responsable de ce qui est fait avec ton compte.</li>
        </ul>
      </section>

      <section>
        <h2>3. Les cours et les prix</h2>
        <ul>
          <li>Il y a trois niveaux : Débutant, Intermédiaire et Avancé. Chaque niveau compte trois mois de cours.</li>
          <li>Un mois s’achète seul. Le niveau complet (3 mois) s’achète aussi en une fois, à un prix réduit.</li>
          <li>Les prix sont affichés en francs CFA (FCFA) sur la page de chaque cours.</li>
          <li>
            Les cours sont donnés en direct. Les replays sont ensuite mis à disposition des élèves qui ont acheté le
            cours.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Le paiement</h2>
        <p>
          Le paiement se fait avec Wave. Ton cours est débloqué dès que Wave confirme ton paiement. Nous ne voyons ni
          ne gardons ton code secret Wave.
        </p>
      </section>

      <section>
        <h2>5. Remboursement</h2>
        <p>{LEGAL.remboursement}</p>
      </section>

      <section>
        <h2>6. Les tests de niveau</h2>
        <p>
          Les tests de niveau sont gratuits. Chaque test ne peut être passé qu’une seule fois, dans le temps indiqué.
          Le résultat décide du niveau proposé.
        </p>
      </section>

      <section>
        <h2>7. Les vidéos et le contenu</h2>
        <ul>
          <li>Les cours, vidéos, textes et transcriptions appartiennent à {LEGAL.editeur}.</li>
          <li>Ton achat te donne un droit d’usage personnel. Il est interdit de copier, partager, publier ou revendre les vidéos et les liens.</li>
          <li>En cas de partage abusif, ton accès peut être suspendu sans remboursement.</li>
        </ul>
      </section>

      <section>
        <h2>8. Avis et messages</h2>
        <ul>
          <li>Tu peux donner ton avis sur un cours que tu as acheté et écrire au professeur.</li>
          <li>Pas d’insultes, de menaces ni de contenu choquant ou illégal.</li>
          <li>Le professeur peut supprimer un avis ou limiter l’accès d’un compte qui ne respecte pas ces règles.</li>
        </ul>
      </section>

      <section>
        <h2>9. Disponibilité du site</h2>
        <p>
          Nous faisons de notre mieux pour que le site fonctionne en continu, mais nous ne pouvons pas garantir
          l’absence d’interruptions (maintenance, panne d’internet, panne d’un service partenaire).
        </p>
      </section>

      <section>
        <h2>10. Tes données</h2>
        <p>
          Nous utilisons tes données uniquement pour faire fonctionner la plateforme. Les détails sont dans notre{' '}
          <a href="/confidentialite" className="font-bold underline">
            politique de confidentialité
          </a>
          .
        </p>
      </section>

      <section>
        <h2>11. Changements et droit applicable</h2>
        <p>
          Nous pouvons modifier ces conditions. La date de mise à jour est indiquée en haut de la page. Ces
          conditions sont régies par le droit de la {LEGAL.pays}.
        </p>
      </section>
    </PageLegale>
  )
}
