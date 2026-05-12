/**
 * Maps Hill-conventional formula to a known common name.
 * Used by validateScene to label well-known compounds.
 * Formulas here must match what `getFormula` produces (conventional + override-map).
 */
export const NAMED_MOLECULES: Record<string, string> = {
  H2O: 'Water',
  H2: 'Hydrogen gas',
  O2: 'Oxygen gas',
  N2: 'Nitrogen gas',
  Cl2: 'Chlorine gas',
  CO2: 'Carbon dioxide',
  CO: 'Carbon monoxide',
  CH4: 'Methane',
  C2H6: 'Ethane',
  C3H8: 'Propane',
  C2H6O: 'Ethanol',
  C6H12O6: 'Glucose',
  NH3: 'Ammonia',
  HCl: 'Hydrochloric acid',
  HNO3: 'Nitric acid',
  H2SO4: 'Sulfuric acid',
  H2O2: 'Hydrogen peroxide',
  NaOH: 'Sodium hydroxide',
  KOH: 'Potassium hydroxide',
  NaCl: 'Sodium chloride',
  MgO: 'Magnesium oxide',
  CaO: 'Calcium oxide',
  CaCO3: 'Calcium carbonate',
  KCl: 'Potassium chloride',
  KNO3: 'Potassium nitrate',
  Na2SO4: 'Sodium sulfate',
  C8H10N4O2: 'Caffeine',
  C9H8O4: 'Aspirin',
}
