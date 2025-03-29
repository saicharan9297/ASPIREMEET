const express = require('express');
const {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
  getMeetingsInRadius
} = require('../controllers/meetingController');

const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(getMeetings)
  .post(protect, createMeeting);

router
  .route('/:id')
  .get(getMeeting)
  .put(protect, updateMeeting)
  .delete(protect, deleteMeeting);

router.put('/:id/join', protect, joinMeeting);
router.get('/radius/:zipcode/:distance', protect, getMeetingsInRadius);

module.exports = router;
