const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Token is missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.userId;
    next();
  });
};

// Get all tasks for the user
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tasks WHERE user_id = ?', [req.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new task
router.post('/', verifyToken, async (req, res) => {
  const { title, description } = req.body;
  try {
    const [result] = await db.query('INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)', [
      req.userId,
      title,
      description,
    ]);
    res.status(201).json({ taskId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a task
router.delete('/:id', verifyToken, async (req, res) => {
  const taskId = req.params.id;
  try {
    const [result] = await db.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// De-authenticate user
router.get('/deauth', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
