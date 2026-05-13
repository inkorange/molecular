/**
 * Render a chemistry formula with proper subscripts using Unicode
 * subscript digits. "H2O" → "H₂O", "C6H12O6" → "C₆H₁₂O₆".
 *
 * Works in any text context — plain DOM, drei <Text> in R3F, attribute
 * values — because the output is just a string with subscript code
 * points, not markup. Cheaper than swapping to <sub> tags and easier to
 * carry through serialisation.
 *
 * Library entries store formulas as ASCII digits ("H2O"). This helper
 * normalises them at render time so the data stays editable in plain
 * text.
 */
const SUBSCRIPT_DIGITS = '₀₁₂₃₄₅₆₇₈₉'

export function formatFormula(formula: string): string {
  return formula.replace(/\d/g, (d) => SUBSCRIPT_DIGITS[Number(d)] ?? d)
}
