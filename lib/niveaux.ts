export const PRIX_MOIS = 50000
export const PRIX_NIVEAU = 150000

export function fcfa(montant: number) {
  return `${montant.toLocaleString('fr-FR')} FCFA`
}

export type Niveau = {
  slug: 'debutant' | 'intermediaire' | 'avance'
  nom: string
  badge: string
  objectif: string
  cta: string
  avantages: string[]
  programme: string[]
}

export const niveaux: Niveau[] = [
  {
    slug: 'debutant',
    nom: 'Débutant',
    badge: 'Niveau I',
    objectif:
      'Communiquer dans les situations essentielles de la vie quotidienne (se présenter, voyager, faire ses achats, se soigner, effectuer des opérations bancaires) avec un anglais simple et fonctionnel.',
    cta: 'Commencer au niveau Débutant',
    avantages: [
      'Se présenter et engager une conversation de base avec confiance',
      'Utiliser la salutation appropriée selon le contexte et l’heure de la journée',
      'Communiquer efficacement en voyage (aéroport, taxi, réservation de vol)',
      'Se débrouiller dans les achats, la négociation de prix et le shopping',
      'Commander un repas et échanger avec le personnel d’un restaurant',
      'Décrire sa famille, son métier et son environnement immédiat',
      'Gérer une situation médicale simple (pharmacie, hôpital, symptômes)',
      'Effectuer une opération bancaire courante (dépôt, retrait) en anglais',
      'Maîtriser les nombres, les jours, les mois et l’heure',
      'Décrire une personne physiquement et sur le plan du caractère',
      'Poser des questions simples et comprendre des réponses courtes du quotidien',
    ],
    programme: [
      'The Alphabet & Greetings',
      'Self-Introduction',
      'Family Members',
      'Jobs & Occupations',
      'Home Objects',
      'Public Places',
      'Verbs: Be, Have & Do',
      'Cardinal & Ordinal Numbers',
      'In the Market',
      'Booking a Flight',
      'At the Airport',
      'At the Restaurant',
      'In the Taxi & Getting Around',
      'Shopping',
      'Sickness & Illness',
      'At the Hospital',
      'At the Pharmacy',
      'At the Checkpoint',
      'Days, Months & Time',
      'The Human Body',
      'At the Bank',
      'Describing People I: Physical Appearance',
      'Describing People II: Character & Personality',
      'General Review & Final Test',
    ],
  },
  {
    slug: 'intermediaire',
    nom: 'Intermédiaire',
    badge: 'Niveau II',
    objectif:
      'Acquérir une maîtrise grammaticale complète de l’anglais (8 temps, 8 parties du discours, articles, pronoms, adjectifs, adverbes) pour s’exprimer avec précision et rédiger des textes structurés.',
    cta: 'Passer le test pour entrer en Intermédiaire',
    avantages: [
      'Maîtriser les 8 temps verbaux anglais (présent, passé, futur, formes parfaites)',
      'Distinguer Present Perfect et Simple Past, la difficulté n°1 des francophones',
      'Construire des phrases correctes en identifiant les 8 parties du discours',
      'Poser des questions complexes et précises avec les WH-questions',
      'Donner des directions et des instructions claires et structurées',
      'Exprimer certitude, incertitude et opinions de façon nuancée',
      'Utiliser correctement les articles (a / an / the), pronoms et adjectifs',
      'Ordonner correctement les adjectifs dans une phrase (règle O-SASCOM)',
      'Rédiger un texte court, structuré et argumenté en anglais',
      'Lire et analyser un texte anglais avec une bonne compréhension',
      'Identifier et corriger ses propres erreurs grammaticales de façon autonome',
    ],
    programme: [
      'Parts of Speech: An Overview',
      'Expressing Certainty & Uncertainty',
      'Giving Directions & Instructions',
      'Regular Verbs',
      'Irregular Verbs',
      'WH- Questions',
      'Vowel & Consonant Sounds',
      'The Simple Present',
      'The Present Continuous',
      'The Simple Past',
      'Be Going To',
      'The Past Progressive',
      'The Simple Future',
      'The Present Perfect',
      'The Past Perfect',
      'Articles: A, An, The',
      'Nouns',
      'Pronouns',
      'Adjectives',
      'Adverbs',
      'General Review 1',
      'General Review 2: Reading',
      'Final Test',
    ],
  },
  {
    slug: 'avance',
    nom: 'Avancé',
    badge: 'Niveau III',
    objectif:
      'Faire de l’anglais un véritable outil professionnel : communication d’entreprise, leadership, rédaction professionnelle, prise de parole en public et gestion de situations complexes.',
    cta: 'Passer le test pour entrer en Avancé',
    avantages: [
      'Rédiger des emails professionnels, des lettres formelles et des lettres de réclamation',
      'Construire un CV et se préparer à un entretien d’embauche en anglais',
      'Prendre la parole en public avec aisance, structure et assurance',
      'Animer, diriger et faciliter une réunion professionnelle en anglais',
      'Rédiger des comptes rendus de réunion (minutes) et des rapports professionnels',
      'Défendre une opinion, argumenter et participer à un débat en anglais',
      'Utiliser les modaux et les tag questions pour un anglais nuancé et naturel',
      'Maîtriser le vocabulaire financier, la monnaie et les calculs en anglais',
      'Développer des qualités de leadership et de management en contexte anglophone',
      'Gérer le stress et résoudre des problèmes professionnels en anglais',
      'Renforcer son écoute active et sa lecture de documents professionnels',
    ],
    programme: [
      'Modal Auxiliaries',
      'Tag Questions',
      'Describing Things Without Knowing the Name',
      'Calculation & Numbers',
      'Currency & Financial English',
      'Giving & Defending Opinions',
      'Formal Letter Writing',
      'Complaint Letters',
      'Professional Email Writing',
      'Meeting Leadership & Facilitation',
      'Minute Writing',
      'Report Writing',
      'Resume / CV Writing',
      'Job Interview Skills',
      'Public Speaking',
      'Discussion & Debate Skills',
      'Qualitative Reading Skills',
      'Listening Skills & Strategies',
      'Leadership Qualities',
      'Management Qualities',
      'Stress Management',
      'Problem Solving',
      'General Review & Final Evaluation',
    ],
  },
]
