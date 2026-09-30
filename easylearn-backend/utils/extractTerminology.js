const model = require('./geminiClient');

/**
 * Extracts key terms and their definitions directly from a document's own
 * text, preserving the lecturer's original wording rather than paraphrasing
 * into generic definitions.
 *
 * @param {string} text - the document's extracted text
 * @returns {Promise<Array<{term: string, lecturer_definition: string}>>}
 */
async function extractTerminology(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot extract terminology from empty text');
  }

  const prompt = `You are building a glossary from a set of lecture notes for a study app.

Read the notes below and identify the key terms, concepts, or acronyms that are specific to this material — the kind of vocabulary a student would need to understand to follow the rest of the notes. For each term, extract its definition using the EXACT wording found in the notes wherever possible. Do not paraphrase or substitute synonyms — the goal is to preserve the lecturer's own phrasing, not to rewrite it.

Only include terms that are actually defined or clearly explained in the text. Do not include generic terms that aren't specific to this material. Aim for quality over quantity — typically 3 to 15 terms depending on how much the document actually defines.

Respond with ONLY a JSON array, no other text, no markdown code fences. Each item must have exactly this shape:
{"term": "the term", "lecturer_definition": "the definition, using the notes' own wording"}

Lecture notes:
"""
${text.slice(0, 15000)}
"""`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  const cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let terms;
  try {
    terms = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI returned invalid JSON for terminology extraction: ${cleaned.slice(0, 200)}`);
  }

  if (!Array.isArray(terms)) {
    throw new Error('AI did not return a valid list of terms');
  }

  // It's valid for a document to have zero clearly-defined terms —
  // unlike segmentation, we don't throw an error on an empty array here.
  return terms;
}

module.exports = extractTerminology;