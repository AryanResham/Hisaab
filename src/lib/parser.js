/**
 * Parses a WhatsApp-style expense message into structured data.
 *
 * Rules:
 *   - Starts with "+" → cash received (reduces what you're owed)
 *   - Otherwise → regular expense
 *   - Number can appear anywhere in the text (with optional rs/₹/Rs prefix/suffix)
 *   - Everything that's not the number/currency marker → description
 *   - No number found → returns error
 *
 * Examples:
 *   "600 mushroom, eggs"      → { amount: 600, description: "mushroom, eggs", type: "expense" }
 *   "samaan 1000rs"           → { amount: 1000, description: "samaan", type: "expense" }
 *   "+500 dad gave cash"      → { amount: 500, description: "dad gave cash", type: "cash_in" }
 *   "+500"                    → { amount: 500, description: "", type: "cash_in" }
 *   "mushroom eggs"           → { error: "No amount found" }
 */
export function parseExpense(input) {
  if (!input || typeof input !== 'string') {
    return { error: 'Empty input' }
  }

  const trimmed = input.trim()
  if (!trimmed) {
    return { error: 'Empty input' }
  }

  // Determine type: starts with "+" → cash_in
  const isCashIn = trimmed.startsWith('+')
  const text = isCashIn ? trimmed.slice(1).trim() : trimmed

  // Regex to find a number with optional rs/₹/Rs around it
  // Matches patterns like: 600, 600rs, Rs600, ₹600, Rs.600, 600 rs, rs 600
  const numberPattern = /(?:(?:rs\.?\s*|₹\s*)(\d+(?:,\d+)*))|(?:(\d+(?:,\d+)*)\s*(?:rs\.?|₹)?)/i
  const match = text.match(numberPattern)

  if (!match) {
    return { error: 'No amount found. Start with a number (e.g. "600 groceries") or "+500" for cash received.' }
  }

  // Extract the number (could be in group 1 or group 2)
  const rawNumber = match[1] || match[2]
  const amount = parseInt(rawNumber.replace(/,/g, ''), 10)

  if (isNaN(amount) || amount <= 0) {
    return { error: 'Invalid amount. Please enter a positive number.' }
  }

  // Build description: remove the matched portion and clean up
  let description = text
    .replace(match[0], ' ')  // Remove the matched number+currency
    .replace(/\s+/g, ' ')   // Collapse whitespace
    .replace(/^[\s,]+|[\s,]+$/g, '') // Trim leading/trailing commas and spaces

  return {
    amount,
    description,
    type: isCashIn ? 'cash_in' : 'expense',
  }
}
