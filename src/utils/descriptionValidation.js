export const DESCRIPTION_MIN_WORDS = 45;
export const DESCRIPTION_MAX_WORDS = 150;

export function countDescriptionWords(description) {
  return String(description || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function descriptionValidationErrorId(description) {
  const wordCount = countDescriptionWords(description);
  if (wordCount < DESCRIPTION_MIN_WORDS) {
    return "ticket.description.validation.minWords";
  }
  if (wordCount > DESCRIPTION_MAX_WORDS) {
    return "ticket.description.validation.maxWords";
  }
  return null;
}
