const authMiddleware = require('./middleware/authMiddleware');

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});