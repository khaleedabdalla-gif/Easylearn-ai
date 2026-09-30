import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

function TopicStudy() {
  const { id, topicId } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(null);
  const [topicCompleted, setTopicCompleted] = useState(false);

  const [brainstormRequest, setBrainstormRequest] = useState('');
  const [brainstormHistory, setBrainstormHistory] = useState([]);
  const [brainstormLoading, setBrainstormLoading] = useState(false);

  const fetchQuiz = async () => {
    setLoading(true);
    setError('');
    try {
      const [topicRes, quizRes] = await Promise.all([
        api.get(`/topics/${topicId}`),
        api.get(`/topics/${topicId}/quiz`),
      ]);
      setTopic(topicRes.data.topic);
      setQuestions(quizRes.data.questions);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('This topic is locked. Complete the previous topic first.');
      } else {
        setError(err.response?.data?.message || 'Could not load this topic.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
    setAnswers({});
    setFeedback({});
    setTopicCompleted(false);
    setBrainstormHistory([]);
  }, [topicId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitAnswer = async (questionId) => {
    const answer = answers[questionId];
    if (!answer || answer.trim().length === 0) {
      setFeedback((prev) => ({ ...prev, [questionId]: { is_correct: false, feedback: 'Please enter an answer first.', pending: true } }));
      return;
    }

    setSubmitting(questionId);
    try {
      const res = await api.post(`/topics/${topicId}/answer`, { question_id: questionId, answer });
      setFeedback((prev) => ({ ...prev, [questionId]: res.data }));
      if (res.data.topic_completed) {
        setTopicCompleted(true);
      }
    } catch (err) {
      setFeedback((prev) => ({ ...prev, [questionId]: { is_correct: false, feedback: 'Something went wrong grading that answer. Please try again.' } }));
    } finally {
      setSubmitting(null);
    }
  };

  const handleBrainstorm = async (e) => {
    e.preventDefault();
    if (!brainstormRequest.trim()) return;

    const request = brainstormRequest;
    setBrainstormRequest('');
    setBrainstormLoading(true);
    try {
      const res = await api.post(`/topics/${topicId}/brainstorm`, { request });
      setBrainstormHistory((prev) => [...prev, { request, response: res.data.response }]);
    } catch (err) {
      setBrainstormHistory((prev) => [...prev, { request, response: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setBrainstormLoading(false);
    }
  };

  if (loading) return <div style={{ maxWidth: 700, margin: '2rem auto' }}><p>Loading topic…</p></div>;

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
        <Link to={`/documents/${id}`} style={{ fontSize: 13, color: '#666' }}>&larr; Back to topics</Link>
        <p style={{ color: 'red', marginTop: 16 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
      <Link to={`/documents/${id}`} style={{ fontSize: 13, color: '#666' }}>&larr; Back to topics</Link>
      <h1 style={{ marginTop: 8 }}>{topic?.title}</h1>
      <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: '1.5rem' }}>{topic?.summary_text}</p>

      <div style={{ background: '#f5f5f5', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 8 }}>
          Comprehension check — answer all questions to unlock the next topic
        </p>

        {questions.map((q) => {
          const fb = feedback[q.question_id];
          return (
            <div key={q.question_id} style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontWeight: 'bold', marginBottom: 8 }}>{q.question_text}</p>
              <textarea
                value={answers[q.question_id] || ''}
                onChange={(e) => handleAnswerChange(q.question_id, e.target.value)}
                style={{ width: '100%', minHeight: 70, marginBottom: 8 }}
                disabled={fb?.is_correct}
              />
              {fb && (
                <p style={{ fontSize: 13, color: fb.is_correct ? 'green' : 'red', marginBottom: 8 }}>
                  {fb.feedback}
                </p>
              )}
              {!fb?.is_correct && (
                <button
                  onClick={() => handleSubmitAnswer(q.question_id)}
                  disabled={submitting === q.question_id}
                  style={{ padding: '6px 14px', background: '#111', color: '#fff', border: 'none', borderRadius: 8 }}
                >
                  {submitting === q.question_id ? 'Checking…' : 'Submit answer'}
                </button>
              )}
            </div>
          );
        })}

        {topicCompleted && (
          <p style={{ fontWeight: 'bold', color: 'green', marginTop: 12 }}>
            🎉 Topic completed! Go back to the topic list to unlock the next one.
          </p>
        )}
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: '1.25rem' }}>
        <p style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 10 }}>💡 Brainstorm — always available</p>

        {brainstormHistory.map((entry, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px' }}>You asked: {entry.request}</p>
            <p style={{ fontSize: 14, background: '#eef', borderRadius: 8, padding: '8px 10px', margin: 0 }}>{entry.response}</p>
          </div>
        ))}

        <form onSubmit={handleBrainstorm} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={brainstormRequest}
            onChange={(e) => setBrainstormRequest(e.target.value)}
            placeholder="Ask for an example or a different explanation"
            style={{ flex: 1, padding: 8 }}
            disabled={brainstormLoading}
          />
          <button type="submit" disabled={brainstormLoading} style={{ padding: '8px 16px' }}>
            {brainstormLoading ? '…' : 'Ask'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TopicStudy;