require("dotenv").config();

const express = require("express");
const app = express();

require("./config/db");

const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const authMiddleware = require("./middleware/authMiddleware");

app.use(express.json());

app.get("/", (req, res) => {
    res.send("EasyLearn AI Running");
});


const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/documents", uploadRoutes);

// Test route to confirm JWT middleware works
app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({ message: "You are authenticated", user: req.user });
});

// Catches multer errors (bad file type, file too large, too many files)
// and any other errors passed via next(err), returning clean JSON
// instead of Express's default HTML error page.
app.use((err, req, res, next) => {
    if (err) {
        console.error(err.message);
        return res.status(400).json({ message: err.message });
    }
    next();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

const quizRoutes = require("./routes/quizRoutes");
app.use("/api/topics", quizRoutes);


