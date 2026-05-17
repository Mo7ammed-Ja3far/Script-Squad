const adminService = require('../services/adminService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getDashboard = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json(successResponse({ stats }, 'Dashboard data retrieved successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const listUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20, search } = req.query;
    const { users, total } = await adminService.listUsers({ role, isActive, page, limit, search });
    res.status(200).json(paginatedResponse({ users }, 'Users retrieved successfully.', page, limit, total));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const getUser = async (req, res) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    res.status(200).json(successResponse({ user }, 'User retrieved successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    res.status(200).json(successResponse({ user }, 'User updated successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const deleteUser = async (req, res) => {
  try {
    const result = await adminService.deleteUser(req.params.id);
    res.status(200).json(successResponse(result, 'User and all associated data deleted successfully.'));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

const listAppointments = async (req, res) => {
  try {
    const { status, dateFrom, dateTo, doctorId, patientId, page = 1, limit = 20 } = req.query;
    const { appointments, total } = await adminService.listAllAppointments({ status, dateFrom, dateTo, doctorId, patientId, page, limit });
    res.status(200).json(paginatedResponse({ appointments }, 'Appointments retrieved successfully.', page, limit, total));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message));
  }
};

module.exports = { getDashboard, listUsers, getUser, updateUser, deleteUser, listAppointments };
