import type { Metadata } from 'next'
import Link from 'next/link'
import PageLegale from '@/components/PageLegale'

export const metadata: Metadata = { title: 'Conditions d’utilisation – ClicAnglais' }

export default function PageCgu() {
  return (
    <PageLegale titre="Conditions Générales d’Utilisation de ClicAnglais" miseAJour="5 novembre 2026">
      <section>
        <h2>1. Présentation</h2>
        <p>
          ClicAnglais est une plateforme de cours d’anglais en ligne, éditée par <strong>Diallo Mamadou Kindy</strong>.
        </p>
        <p>
          Pour toute demande : <strong>clicanglais@gmail.com</strong>
        </p>
        <p>La création d’un compte ou l’achat d’un cours emporte acceptation des présentes conditions.</p>
      </section>

      <section>
        <h2>2. Compte utilisateur</h2>
        <ul>
          <li>L’achat d’un cours requiert une adresse électronique valide.</li>
          <li>
            Le compte est strictement personnel. Il est limité à un compte par personne et ne peut être partagé ni cédé.
          </li>
          <li>
            L’utilisateur veille à la confidentialité de ses identifiants et demeure responsable de toute activité
            réalisée depuis son compte.
          </li>
          <li>Les personnes âgées de moins de 18 ans doivent obtenir l’autorisation de leur représentant légal.</li>
        </ul>
      </section>

      <section>
        <h2>3. Cours et tarifs</h2>
        <ul>
          <li>La formation comprend trois niveaux : Débutant, Intermédiaire et Avancé. Chaque niveau s’étend sur trois mois.</li>
          <li>Les cours peuvent être achetés au mois, ou par niveau complet à un tarif préférentiel.</li>
          <li>
            Les prix sont exprimés en francs CFA (FCFA). Ils peuvent être modifiés à tout moment, sans incidence sur les
            cours déjà achetés.
          </li>
          <li>
            Les cours sont dispensés en direct. En cas d’annulation ou de report d’une séance, celle-ci est reprogrammée
            ou rendue accessible en replay.
          </li>
          <li>
            Les replays sont accessibles aux utilisateurs ayant acheté le cours concerné, pendant la durée indiquée sur
            la page du cours. À défaut d’indication, l’accès est maintenu jusqu’à trente jours après la fin du niveau.
          </li>
          <li>L’éditeur peut adapter le contenu, le calendrier et les outils pédagogiques afin d’améliorer le service.</li>
        </ul>
      </section>

      <section>
        <h2>4. Paiement</h2>
        <ul>
          <li>Le paiement s’effectue par Wave. L’utilisateur renseigne ensuite son numéro de transaction sur la plateforme.</li>
          <li>L’accès au cours est activé après vérification du paiement, généralement dans un délai de quelques heures.</li>
          <li>
            Le montant versé doit correspondre exactement au prix affiché. Un numéro de transaction erroné, déjà utilisé
            ou invérifiable peut entraîner le refus de l’accès.
          </li>
          <li>L’éditeur n’a accès à aucun code secret Wave et n’en conserve aucun.</li>
          <li>Toute fraude au paiement entraîne la suspension du compte, sans remboursement.</li>
        </ul>
      </section>

      <section>
        <h2>5. Absence de rétractation et conditions de remboursement</h2>
        <ul>
          <li>
            Les contenus étant numériques et accessibles dès l’activation du cours, l’utilisateur{' '}
            <strong>renonce à son droit de rétractation</strong> à compter de cette activation.
          </li>
          <li>
            Tout cours activé est définitivement acquis et <strong>non remboursable</strong>, notamment en cas
            d’absence, d’abandon ou de changement d’avis.
          </li>
          <li>
            Par exception, un remboursement peut être accordé en cas de double paiement ou de dysfonctionnement
            technique imputable à la plateforme empêchant l’accès au cours. La demande doit être adressée{' '}
            <strong>dans un délai de sept jours</strong>, accompagnée de la preuve de paiement.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Tests de niveau</h2>
        <ul>
          <li>Les tests sont gratuits et ne peuvent être passés qu’une seule fois, dans le temps imparti.</li>
          <li>
            Leur résultat constitue une recommandation. Le choix du niveau relève de la seule responsabilité de
            l’utilisateur.
          </li>
          <li>
            Toute fraude, notamment l’ouverture de plusieurs comptes pour repasser un test, entraîne l’annulation du
            résultat.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Comportements interdits</h2>
        <p>Il est interdit de :</p>
        <ul>
          <li>partager ses identifiants, les liens de cours ou les replays ;</li>
          <li>enregistrer, copier, publier ou revendre les cours et les vidéos ;</li>
          <li>tenir des propos injurieux, harceler d’autres utilisateurs ou perturber les cours ;</li>
          <li>fournir de fausses informations ou utiliser le compte d’un tiers.</li>
        </ul>
      </section>

      <section>
        <h2>8. Propriété intellectuelle</h2>
        <p>
          Les cours, vidéos, textes et exercices sont la propriété exclusive de l’éditeur. L’achat confère à
          l’utilisateur un droit d’usage personnel, limité à l’apprentissage et à la durée de son accès.
        </p>
        <p>
          Toute reproduction ou diffusion entraîne la suppression de l’accès, sans remboursement, et autorise l’éditeur
          à demander réparation du préjudice subi.
        </p>
      </section>

      <section>
        <h2>9. Enregistrement des séances</h2>
        <p>
          Les cours en direct sont enregistrés afin de produire des replays. En y participant, l’utilisateur consent à
          ce que sa voix, ses interventions et, le cas échéant, son image y figurent. Il peut désactiver sa caméra et son
          microphone.
        </p>
      </section>

      <section>
        <h2>10. Avis et messages</h2>
        <p>
          L’utilisateur peut publier un avis sur un cours acheté et écrire à l’enseignant, dans le respect d’un langage
          courtois, à l’exclusion de tout contenu injurieux, choquant ou illégal. L’éditeur peut supprimer tout message
          non conforme et restreindre l’accès du compte concerné.
        </p>
        <p>
          L’utilisateur autorise l’éditeur à afficher ses avis, sans mention de son nom complet, pour présenter
          ClicAnglais.
        </p>
      </section>

      <section>
        <h2>11. Engagements et limites de responsabilité</h2>
        <ul>
          <li>
            L’éditeur s’engage à dispenser un enseignement de qualité avec diligence, mais{' '}
            <strong>ne garantit aucun résultat</strong> (niveau, note, emploi, admission). La progression dépend
            également de l’implication personnelle de l’utilisateur.
          </li>
          <li>
            La plateforme peut connaître des interruptions (maintenance, panne de connexion, défaillance d’un service
            partenaire). L’utilisateur doit disposer de son propre appareil et d’une connexion internet adaptée.
          </li>
          <li>
            La responsabilité de l’éditeur est limitée <strong>au montant payé pour le cours concerné</strong>. Elle ne
            couvre pas les dommages indirects (perte d’opportunité, préjudice moral, etc.) ni les actes des autres
            utilisateurs.
          </li>
          <li>
            L’éditeur n’est pas responsable des événements échappant à son contrôle : coupure d’électricité ou de réseau,
            défaillance d’un prestataire, catastrophe naturelle, décision d’une autorité.
          </li>
          <li>
            L’utilisateur qui manque aux présentes conditions et cause ainsi un préjudice à l’éditeur est tenu de
            l’indemniser.
          </li>
        </ul>
      </section>

      <section>
        <h2>12. Suspension et suppression de compte</h2>
        <p>
          L’éditeur peut suspendre ou fermer un compte en cas de fraude, de partage de contenus ou de comportement
          préjudiciable, sans remboursement. L’utilisateur peut demander la suppression de son compte à{' '}
          <strong>clicanglais@gmail.com</strong>, également sans remboursement.
        </p>
      </section>

      <section>
        <h2>13. Données personnelles</h2>
        <p>
          Les données collectées (identité, adresse électronique, numéro WhatsApp, numéro de transaction, résultats aux
          tests) sont utilisées exclusivement pour le fonctionnement de la plateforme : gestion des comptes,
          vérification des paiements, sécurité et amélioration du service. Elles ne sont jamais vendues à des tiers.
        </p>
        <p>
          Chaque utilisateur peut demander l’accès à ses données, leur rectification ou leur suppression à l’adresse{' '}
          <strong>clicanglais@gmail.com</strong>. Pour plus de détails, consulter la{' '}
          <Link href="/confidentialite" className="font-bold underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>14. Modification des conditions</h2>
        <p>
          L’éditeur peut modifier les présentes conditions à tout moment. La nouvelle version est publiée sur le site
          avec sa date de mise à jour, et la poursuite de l’utilisation de la plateforme vaut acceptation. Un cours déjà
          acheté demeure régi par les conditions en vigueur à la date de l’achat.
        </p>
      </section>

      <section>
        <h2>15. Règlement des différends</h2>
        <p>
          Toute réclamation est adressée par écrit à <strong>clicanglais@gmail.com</strong>. L’éditeur y répond dans un
          délai de trente jours et recherche une solution amiable.
        </p>
        <p>
          À défaut d’accord, le différend est soumis à une médiation ou à un arbitrage en ligne, conduit en français et
          par écrit, devant un arbitre unique choisi d’un commun accord. Chaque litige est traité individuellement. Toute
          réclamation doit être formulée dans un délai d’un an à compter des faits qui la fondent.
        </p>
      </section>
    </PageLegale>
  )
}
