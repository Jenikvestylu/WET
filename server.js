const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'auth_db'
});

db.connect(err => {
  if (err) throw err;
  console.log('Database connected');
});

const secret = 'supersecretkey';

// Registrace
app.post('/register', async (req, res) => {
  const { username, name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)';
  db.query(sql, [username, name, email, hashedPassword], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User registered successfully' });
  });
});

// Přihlášení
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
    res.json({ token, user });
  });
});

// Úprava uživatele
app.put('/user', (req, res) => {
  const { id, username, name, email } = req.body;
  const sql = 'UPDATE users SET username=?, name=?, email=? WHERE id=?';
  db.query(sql, [username, name, email, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User updated successfully' });
  });
});

app.listen(5000, () => console.log('Server running on port 5000'));

// Frontend (React)
import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', name: '', email: '', password: '' });

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/register', formData);
      alert('User registered successfully');
    } catch (error) {
      alert('Error registering user');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="username" placeholder="Username" onChange={handleChange} />
      <input type="text" name="name" placeholder="Name" onChange={handleChange} />
      <input type="email" name="email" placeholder="Email" onChange={handleChange} />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} />
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
