import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

function statusLabel(status) {
  if (status === 'completed') return { text: 'Completed', color: '#0a7d2c' };
  if (status === 'in_progress') return { text: 'In progress', color: '#b8860b' };
  return { text: 'Locked', color: '#999' };
}

function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reprocessing, setReprocessing] = useState(false);

  const fetchProgress = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/documents/${id}/progress`);
      setTopics(res.data.progress);
    } catch (err) {
      setError('Could not load this document\'s topics. It may not be segmented yet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [id]);

  const handleTopicClick = (topic, index) => {
    if (index === 0 || topic.status !== 'locked') {
      navigate(`/documents/${id}/topics/${topic.topic_id}`);
    }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    setError('');
    try {
      await api.post(`/documents/${id}/segment?force=true`);
      await api.post(`/documents/${id}/terminology?force=true`);
      await api.post(`/documents/${id}/summarize`);
      await fetchProgress();
    } catch (err) {
      setError(err.response?.data?.message || 'Reprocessing failed. Please try again.');
    } finally {
      setReprocessing(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
      <Link to="/" style={{ fontSize: 13, color: '#666' }}>&larr; Back to documents</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <h1>Topics</h1>
        <button onClick={handleReprocess} disabled={reprocessing} style={{ padding: '6px 14px', fontSize: 13 }}>
          {reprocessing ? 'Reprocessing…' : '↻ Reprocess'}
        </button>
      </div>

      {loading && <p>Loading topics…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && topics.length === 0 && (
        <p style={{ color: '#666' }}>This document hasn't been segmented into topics yet.</p>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {topics.map((topic, index) => {
          const isLocked = index !== 0 && topic.status === 'locked';
          const label = index === 0 && topic.status === 'locked'
            ? { text: 'Start here', color: '#1a5fb4' }
            : statusLabel(topic.status);
          return (
            <div
              key={topic.topic_id}
              onClick={() => handleTopicClick(topic, index)}
              style={{
                border: '1px solid #ddd',
                borderRadius: 12,
                padding: '1rem',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.6 : 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>{topic.title}</p>
                <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Attempts: {topic.attempts}</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: label.color }}>
                {isLocked ? '🔒 Locked' : label.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DocumentDetail;