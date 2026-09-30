const model = require('./geminiClient');

/**
 * Generates a simplified, terminology-locked summary for a single topic,
 * reusing the exact wording from the document's glossary rather than
 * paraphrasing into generic language.
 *
 * @param {string} fullText - the document's full extracted text
 * @param {string} topicTitle - the title of the topic to summarize
 * @param {Array<{term: string, lecturer_definition: string}>} glossary - the document's terminology
 * @returns {Promise<string>} the generated summary text
 */
async function summarizeTopic(fullText, topicTitle, glossary) {
  if (!fullText || fullText.trim().length === 0) {
    throw new Error('Cannot summarize empty text');
  }

  const glossarySection = glossary.length > 0
    ? glossary.map((g) => `- ${g.term}: ${g.lecturer_definition}`).join('\n')
    : '(no specific terminology was extracted for this document)';

  const prompt = `You are a study assistant writing a simplified summary of ONE topic from a set of lecture notes, for a student to revise from.

The topic to summarize is: "${topicTitle}"

Below is the document's own terminology glossary. You MUST reuse these exact terms and their exact wording wherever they appear in your summary. Do NOT substitute synonyms or rephrase these terms into generic language — a student is relying on this summary matching what their lecturer actually taught them.

Glossary:
${glossarySection}

Now write a clear, simplified summary of ONLY the "${topicTitle}" topic, based on the full notes below. Focus only on the material relevant to this specific topic — ignore unrelated parts of the document. Keep it concise (roughly 100-250 words), written in plain, easy-to-follow language, but strictly preserving the glossary terms above wherever they're relevant.

Respond with ONLY the summary text — no headings, no markdown, no preamble like "Here is a summary".

Full lecture notes:
"""
${fullText.slice(0, 15000)}
"""`;

  const result = await model.generateContent(prompt);
  const summaryText = result.response.text().trim();

  if (!summaryText) {
    throw new Error('AI returned an empty summary');
  }

  return summaryText;
}

module.exports = summarizeTopic;