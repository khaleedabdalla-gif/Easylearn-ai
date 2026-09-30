const model = require('./geminiClient');

/**
 * Generates 1-3 short-answer comprehension questions for a topic,
 * based on its summary and the document's glossary, along with a
 * model answer for each (used later to grade student responses).
 *
 * @param {string} topicTitle
 * @param {string} summaryText
 * @param {Array<{term: string, lecturer_definition: string}>} glossary
 * @returns {Promise<Array<{question_text: string, model_answer: string}>>}
 */
async function generateQuizQuestions(topicTitle, summaryText, glossary) {
  if (!summaryText || summaryText.trim().length === 0) {
    throw new Error('Cannot generate questions from an empty summary');
  }

  const glossarySection = glossary.length > 0
    ? glossary.map((g) => `- ${g.term}: ${g.lecturer_definition}`).join('\n')
    : '(no specific terminology for this document)';

  const prompt = `You are creating short comprehension-check questions for a student studying the topic "${topicTitle}".

These questions must be answerable directly from the summary below — the goal is to confirm the student actually understood what they just read, not to test unrelated knowledge.

Topic summary:
"""
${summaryText}
"""

Relevant terminology:
${glossarySection}

Write 2 short-answer questions that test understanding of this specific topic. For each question, also provide a model answer — a concise, correct answer that captures what's needed to consider the question correctly answered. The model answer will be used to grade the student's response, so it should be clear and specific enough to judge against, without requiring an exact word-for-word match.

Respond with ONLY a JSON array, no other text, no markdown code fences. Each item must have exactly this shape:
{"question_text": "the question", "model_answer": "a concise correct answer"}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  const cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let questions;
  try {
    questions = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI returned invalid JSON for quiz generation: ${cleaned.slice(0, 200)}`);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('AI did not return a valid list of questions');
  }

  return questions;
}

module.exports = generateQuizQuestions;