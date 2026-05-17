const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { protect, authorize } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

router.use(protect);

router.post('/join', authorize('patient'), validate(schemas.joinQueue), queueController.join);
router.get('/my-queue', authorize('doctor'), queueController.getQueue);
router.get('/:doctorId', authorize('admin', 'doctor'), queueController.getQueue);
router.post('/call-next', authorize('doctor'), queueController.callNext);
router.patch('/:queueId/remove', authorize('doctor'), queueController.removeEntry);

module.exports = router;
