// Compte Wave Business de ClicAnglais (affiché sur la page de paiement)
export const WAVE_LIEN_PAIEMENT = 'https://pay.wave.com/m/M_ci_M2UNBthO86fm/c/ci/'
export const WAVE_NOM_COMPTE = 'CLIC ANGLAIS'

// Lien de paiement avec le montant déjà rempli (si Wave l'accepte, sinon l'élève le saisit)
export function lienWave(montant: number) {
  const m = Math.round(Number(montant))
  return Number.isFinite(m) && m > 0 ? `${WAVE_LIEN_PAIEMENT}?amount=${m}` : WAVE_LIEN_PAIEMENT
}
