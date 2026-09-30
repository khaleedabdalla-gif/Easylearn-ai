const model = require('./geminiClient');

/**
 * Grades a student's free-text answer against a question and its model
 * answer, returning whether it's correct and brief feedback explaining why
 * — used both to record the attempt and to re-explain on a wrong answer.
 *
 * @param {string} questionText
 * @param {string} modelAnswer
 * @param {string} studentAnswer
 * @returns {Promise<{is_correct: boolean, feedback: string}>}
 */
async function gradeAnswer(questionText, modelAnswer, studentAnswer) {
  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return {
      is_correct: false,
      feedback: 'No answer was provided. Please write a response before submitting.',
    };
  }

  const prompt = `You are grading a student's answer to a short comprehension question, for a study app.

Question: "${questionText}"

Model answer (what a correct response should cover): "${modelAnswer}"

Student's answer: "${studentAnswer}"

Judge whether the student's answer demonstrates correct understanding. The student does NOT need to match the model answer word-for-word — accept answers that are correct in substance, even if phrased differently or less completely, as long as the core understanding is there. Mark it incorrect if the student's answer is wrong, contradicts the material, is too vague to demonstrate understanding, or is clearly a guess/non-answer.

If incorrect, write brief, encouraging feedback (2-3 sentences) that explains what the correct answer should have covered, without being harsh — this will be shown to the student as a re-explanation, so make it genuinely helpful for understanding, not just "that's wrong."

If correct, write brief positive feedback (1 sentence) confirming what they got right.

Respond with ONLY a JSON object, no other text, no markdown code fences, in exactly this shape:
{"is_correct": true or false, "feedback": "the feedback text"}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  const cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let grading;
  try {
    grading = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI returned invalid JSON for answer grading: ${cleaned.slice(0, 200)}`);
  }

  if (typeof grading.is_correct !== 'boolean' || !grading.feedback) {
    throw new Error('AI did not return a valid grading result');
  }

  return grading;
}

module.exports = gradeAnswer;