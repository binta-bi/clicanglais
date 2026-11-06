import type { Metadata } from 'next'
import PageLegale from '@/components/PageLegale'

export const metadata: Metadata = { title: 'Confidentialité – ClicAnglais' }

export default function PageConfidentialite() {
  return (
    <PageLegale titre="Politique de confidentialité de ClicAnglais" miseAJour="5 novembre 2026">
      <section>
        <h2>1. Objet</h2>
        <p>
          La présente politique décrit les données personnelles collectées par ClicAnglais, les raisons de leur
          utilisation et les personnes qui y ont accès. Le responsable de la plateforme est{' '}
          <strong>Diallo Mamadou Kindy</strong>.
        </p>
        <p>
          Pour toute demande : <strong>clicanglais@gmail.com</strong>
        </p>
      </section>

      <section>
        <h2>2. Données collectées</h2>
        <ul>
          <li>Nom et adresse électronique, communiqués lors de l’inscription.</li>
          <li>Numéro WhatsApp, communiqué lors de l’inscription, afin que l’équipe ClicAnglais puisse contacter l’utilisateur.</li>
          <li>Mot de passe, conservé sous forme chiffrée et donc illisible par l’éditeur.</li>
          <li>Niveau et résultats aux tests de niveau (réponses, score, date).</li>
          <li>Commandes et cours achetés (cours, montant, date).</li>
          <li>
            Numéro de transaction Wave et numéro de téléphone indiqué par l’utilisateur, nécessaires à la vérification
            du paiement.
          </li>
          <li>Messages adressés à l’enseignant et avis publiés.</li>
          <li>
            Statistiques de fréquentation du site : pages consultées et date de visite, rattachées à un identifiant
            aléatoire temporaire, sans nom ni adresse électronique.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Finalités</h2>
        <p>Les données sont utilisées pour :</p>
        <ul>
          <li>créer le compte et permettre la connexion ;</li>
          <li>donner accès aux cours achetés, y compris aux liens des cours en direct ;</li>
          <li>recommander le niveau adapté à partir des tests ;</li>
          <li>permettre à l’enseignant de suivre les inscriptions et les achats, de contacter les inscrits et de répondre aux messages ;</li>
          <li>mesurer la fréquentation du site afin d’améliorer le service.</li>
        </ul>
        <p>
          Les données ne sont <strong>ni vendues ni utilisées à des fins publicitaires</strong>.
        </p>
      </section>

      <section>
        <h2>4. Accès aux données</h2>
        <ul>
          <li>
            <strong>L’utilisateur</strong>, pour son propre compte.
          </li>
          <li>
            <strong>L’enseignant</strong>, aux fins de gestion de la plateforme (élèves, achats, résultats, messages).
          </li>
          <li>
            <strong>Les prestataires techniques</strong> qui assurent le fonctionnement du service :
            <ul>
              <li>Supabase (base de données et connexion) ;</li>
              <li>Vercel (hébergement du site) ;</li>
              <li>
                Wave (paiement). Wave traite le paiement : l’éditeur ne reçoit ni le code secret ni les identifiants Wave
                de l’utilisateur.
              </li>
            </ul>
          </li>
          <li>
            <strong>Les autres élèves</strong> n’ont pas accès aux données de l’utilisateur. Seul son nom peut apparaître
            à côté d’un avis qu’il a publié.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Durée de conservation</h2>
        <p>
          Les données sont conservées tant que le compte existe. L’utilisateur peut en demander la suppression à{' '}
          <strong>clicanglais@gmail.com</strong>. Certaines informations de paiement peuvent être conservées plus
          longtemps lorsque la loi ou les obligations comptables l’exigent.
        </p>
      </section>

      <section>
        <h2>6. Droits de l’utilisateur</h2>
        <p>
          Chaque utilisateur peut demander à consulter, rectifier ou supprimer ses données. La demande est adressée à{' '}
          <strong>clicanglais@gmail.com</strong> depuis l’adresse électronique associée au compte, afin de permettre
          l’identification du demandeur.
        </p>
      </section>

      <section>
        <h2>7. Cookies et stockage local</h2>
        <p>
          La plateforme enregistre sur l’appareil de l’utilisateur uniquement les éléments nécessaires au maintien de sa
          connexion et au comptage anonyme des visites (identifiant aléatoire effacé à la fermeture de l’onglet). Aucun
          cookie publicitaire n’est utilisé.
        </p>
      </section>

      <section>
        <h2>8. Modification de la politique</h2>
        <p>La présente politique peut être modifiée. La date de dernière mise à jour figure en tête de page.</p>
      </section>
    </PageLegale>
  )
}
