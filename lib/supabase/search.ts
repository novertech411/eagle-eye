// Builds a case-insensitive "contains" pattern, treating % and _ as literal characters.
export function containsPattern(term: string) {
  return `%${term.trim().replace(/[\\%_]/g, '\\$&')}%`
}

// Quotes a value for use inside .or(), where commas and parentheses are otherwise syntax.
export function quoteFilterValue(value: string) {
  return `"${value.replace(/["\\]/g, '\\$&')}"`
}
