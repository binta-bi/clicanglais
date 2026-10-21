export type NiveauSlug = 'debutant' | 'intermediaire' | 'avance'
export type CodeTest = 'test1' | 'test2'

export type EtatTentative = {
  status: 'en_cours' | 'reussi' | 'echoue' | 'expire'
  score: number | null
  total: number
  deadline: string
}

// Réponse de la fonction SQL my_test_status()
export type EtatTests = {
  niveau: NiveauSlug | null
  test1: EtatTentative | null
  test2: EtatTentative | null
  test1_disponible: boolean
  test2_disponible: boolean
  test2_confirmation_requise: boolean
  suite: 'test1' | null
}

export const NOM_NIVEAU: Record<NiveauSlug, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

export const INFOS_TEST: Record<
  CodeTest,
  { titre: string; nbQuestions: number; minutes: number; seuil: number; bonnesReponses: number }
> = {
  test1: { titre: 'Test Intermédiaire', nbQuestions: 30, minutes: 30, seuil: 80, bonnesReponses: 24 },
  test2: { titre: 'Test Avancé', nbQuestions: 60, minutes: 50, seuil: 80, bonnesReponses: 48 },
}

export function estCodeTest(valeur: string | undefined): valeur is CodeTest {
  return valeur === 'test1' || valeur === 'test2'
}
