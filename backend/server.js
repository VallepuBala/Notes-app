const express = require('express');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require("cors");

const app = express();
const PORT = 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

app.use(express.json());
app.use(cors({
    origin: "https://notes-app-jet-xi.vercel.app", // Replace with your Vercel frontend URL
    credentials: true
}));

// Initialize SQLite Database
const path = require('path');

const dbPath = path.join(__dirname, 'notes.db'); // Ensures the correct path

try {
    const db = new Database(dbPath);
    console.log('Connected to SQLite database');

    // Enable foreign keys (Important for referential integrity)
    db.pragma('foreign_keys = ON');

    // Create Users Table
    db.exec(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create Notes Table
    db.exec(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        pinned BOOLEAN DEFAULT 0,
        archived BOOLEAN DEFAULT 0,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
} catch (err) {
    console.error('Error connecting to SQLite database:', err.message);
}


// User Signup
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
        [name, email, hashedPassword],
        function (err) {
            if (err) return res.status(400).json({ error: 'User already exists' });
            res.json({ message: 'User registered successfully' });
        }
    );
});

// User Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    });
});

// Middleware to Verify JWT Token
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

// Fetch Notes for Logged-in User
app.get("/notes", authenticateToken, (req, res) => {
    db.all(`SELECT * FROM notes WHERE user_id = ?`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create a New Note
app.post("/notes", authenticateToken, (req, res) => {
    const { title, content, category } = req.body;
    db.run(
        `INSERT INTO notes (title, content, category, user_id) VALUES (?, ?, ?, ?)`,
        [title, content, category, req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, title, content, category });
        }
    );
});

// Delete a Note
app.delete("/notes/:id", authenticateToken, (req, res) => {
    db.run(`DELETE FROM notes WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Note deleted successfully" });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
