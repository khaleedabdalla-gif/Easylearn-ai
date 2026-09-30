const model = require('./geminiClient');

/**
 * Takes raw extracted text from a document and asks the AI to split it
 * into a sequence of distinct topics, preserving their original order.
 *
 * @param {string} text - the document's extracted text
 * @returns {Promise<Array<{title: string, order_index: number}>>}
 */
async function segmentTopics(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot segment empty text');
  }

  const prompt = `You are analysing a set of lecture notes to split them into distinct topics for a study app.

Read the notes below and identify the separate topics covered, in the order they appear. Each topic should be a coherent chunk of related material — not too granular (don't split every paragraph into its own topic), and not too broad (don't lump the whole document into one topic unless it genuinely only covers one thing).

Respond with ONLY a JSON array, no other text, no markdown code fences. Each item must have exactly this shape:
{"title": "short descriptive topic title", "order_index": 1}

order_index should start at 1 and increase in the order topics appear.

Lecture notes:
"""
${text.slice(0, 15000)}
"""`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  // Strip markdown code fences if the model adds them despite instructions
  const cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let topics;
  try {
    topics = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI returned invalid JSON for topic segmentation: ${cleaned.slice(0, 200)}`);
  }

  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error('AI did not return a valid list of topics');
  }

  return topics;
}

module.exports = segmentTopics;