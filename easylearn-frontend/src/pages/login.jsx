import { useState } from 'react';
import api from '../api';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (isRegister && !fullName)) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await api.post('/auth/register', { full_name: fullName, email, password, role });
        // After successful registration, log them in automatically
        const loginRes = await api.post('/auth/login', { email, password });
        onLogin(loginRes.data.token);
      } else {
        const res = await api.post('/auth/login', { email, password });
        onLogin(res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: 12 }}>
      <h1 style={{ textAlign: 'center' }}>EasyLearn AI</h1>
      <p style={{ textAlign: 'center', color: '#666', fontSize: 14 }}>Study assistant for your lecture notes</p>

      <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', margin: '1.5rem 0' }}>
        <button
          onClick={() => setIsRegister(false)}
          style={{ flex: 1, padding: 8, background: !isRegister ? '#eee' : 'transparent', border: 'none', fontWeight: !isRegister ? 'bold' : 'normal' }}
        >
          Log in
        </button>
        <button
          onClick={() => setIsRegister(true)}
          style={{ flex: 1, padding: 8, background: isRegister ? '#eee' : 'transparent', border: 'none', fontWeight: isRegister ? 'bold' : 'normal' }}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Full name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: '100%', padding: 8 }} />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>

        {isRegister && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>I am a</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: 8 }}>
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
            </select>
          </div>
        )}

        {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>
          {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
        </button>
      </form>
    </div>
  );
}

export default Login;