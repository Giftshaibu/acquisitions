import express from 'express';
import { fetchAllUsers } from '../controllers/users.controller.js';

const router = express.Router();

router.get('/', fetchAllUsers);
router.get('/:id', (req, res) => {
  res.send('GET /api/users/:id');
});
router.put('/:id', (req, res) => {
  res.send('PUT /api/users/:id');
});
router.delete('/:id', (req, res) => {
  res.send('DELETE /api/users/:id');
});

export default router;