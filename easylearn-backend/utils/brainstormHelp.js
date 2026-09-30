const model = require('./geminiClient');

/**
 * Generates on-demand help for a topic — examples, analogies, alternate
 * explanations, or answers to a student's specific question — reusing
 * the topic's locked terminology throughout.
 *
 * @param {string} topicTitle
 * @param {string} summaryText
 * @param {Array<{term: string, lecturer_definition: string}>} glossary
 * @param {string} studentRequest - e.g. "give me an example", "explain this differently", or a free-form question
 * @returns {Promise<string>} the AI's response
 */
async function brainstormHelp(topicTitle, summaryText, glossary, studentRequest) {
  if (!studentRequest || studentRequest.trim().length === 0) {
    throw new Error('A request is required (e.g. "give me an example")');
  }

  const glossarySection = glossary.length > 0
    ? glossary.map((g) => `- ${g.term}: ${g.lecturer_definition}`).join('\n')
    : '(no specific terminology for this document)';

  const prompt = `You are a helpful, encouraging study assistant helping a student with the topic "${topicTitle}".

Topic summary (what the student has already read):
"""
${summaryText}
"""

Relevant terminology \u2014 reuse these exact terms and their wording wherever relevant, do not substitute synonyms:
${glossarySection}

The student's request: "${studentRequest}"

Respond helpfully and directly to their request. If they're asking for an example, give a concrete, relatable one. If they're asking for an analogy, make it intuitive. If they're asking a specific question, answer it clearly using the topic's own terminology. Keep your response focused and not too long (roughly 100-200 words) \u2014 this is a supplementary aid, not a replacement for the summary they already have.

Do not simply repeat the summary back to them. Add genuine value: a new angle, a concrete illustration, or a direct answer to what they asked.

Respond with ONLY the helpful response text \u2014 no headings, no markdown, no preamble like "Sure, here's an example".`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  if (!responseText) {
    throw new Error('AI returned an empty response');
  }

  return responseText;
}

module.exports = brainstormHelp;