import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function formatFileType(mimeType) {
  if (!mimeType) return 'Unknown';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('wordprocessingml') || mimeType === 'application/msword') return 'DOCX';
  if (mimeType.includes('presentationml')) return 'PPTX';
  if (mimeType.includes('text/plain')) return 'TXT';
  return mimeType;
}

function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents);
    } catch (err) {
      setError('Could not load your documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please choose at least one file to upload.');
      return;
    }

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('documents', file);
    }

    setUploading(true);
    try {
      const uploadRes = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedFiles(null);
      e.target.reset();
      await fetchDocuments();

      // Auto-process each newly uploaded document: segment -> terminology -> summarize.
      // Runs in the background — we don't block the UI on this, since it can take a while.
      const newDocIds = uploadRes.data.document_ids || [];
      processDocuments(newDocIds);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const processDocuments = async (docIds) => {
    for (const docId of docIds) {
      try {
        await api.post(`/documents/${docId}/segment`);
        await api.post(`/documents/${docId}/terminology`);
        await api.post(`/documents/${docId}/summarize`);
      } catch (err) {
        // A single document failing to process (e.g. unsupported PPTX content)
        // shouldn't block the others — just log it and move on.
        console.error(`Auto-processing failed for document ${docId}:`, err.response?.data || err.message);
      }
    }
    // Refresh the list once processing finishes, in case we later show a "ready" indicator
    fetchDocuments();
  };


  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Your documents</h1>
        <button onClick={onLogout} style={{ padding: '6px 14px' }}>Log out</button>
      </div>

      <form onSubmit={handleUpload} style={{ border: '1px dashed #999', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Upload notes — up to 30 files, PDF/DOCX/TXT/PPTX</p>
        <input type="file" multiple accept=".pdf,.docx,.txt,.pptx" onChange={handleFileChange} style={{ marginBottom: 10 }} />
        <br />
        <button type="submit" disabled={uploading} style={{ padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 8 }}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>}

      {loading ? (
        <p>Loading your documents…</p>
      ) : documents.length === 0 ? (
        <p style={{ color: '#666' }}>No documents yet — upload your first set of notes above.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              onClick={() => navigate(`/documents/${doc.document_id}`)}
              style={{ border: '1px solid #ddd', borderRadius: 12, padding: '1rem', cursor: 'pointer' }}
            >
              <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>{doc.original_name}</p>
              <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
                {formatFileType(doc.file_type)} · uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;