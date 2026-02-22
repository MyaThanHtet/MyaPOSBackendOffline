const express = require('express');
const expenseController = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', authenticate, expenseController.summary);
router.get('/', authenticate, expenseController.listExpenses);
router.post('/', authenticate, expenseController.createExpense);
router.put('/:id', authenticate, expenseController.upsertExpense);
router.delete('/:id', authenticate, expenseController.deleteExpense);

module.exports = router;
