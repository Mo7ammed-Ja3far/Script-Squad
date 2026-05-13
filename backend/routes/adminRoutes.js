const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// Apply protection to all routes in this file
router.use(protect);
router.use(authorize('admin'));

// User Management
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);

// Appointment Management
router.get('/appointments', adminController.getAppointments);
router.delete('/appointments/:id', adminController.deleteAppointment);

module.exports = router;
