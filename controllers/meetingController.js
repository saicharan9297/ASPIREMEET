const Meeting = require('../models/Meeting');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
//const geocoder = require('../utils/geocoder'); // Make sure to require geocoder

// @desc    Get all meetings or meetings for specific user
// @route   GET /api/v1/meetings
// @route   GET /api/v1/users/:userId/meetings
// @access  Public
exports.getMeetings = asyncHandler(async (req, res, next) => {
  if (req.params.userId) {
    const meetings = await Meeting.find({ creator: req.params.userId })
      .populate('creator', 'username email')
      .populate('participants', 'username email');
    
    return res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings
    });
  }

  // If not filtering by user, return all meetings with populated fields
  const meetings = await Meeting.find()
    .populate('creator', 'username email')
    .populate('participants', 'username email');

  res.status(200).json({
    success: true,
    count: meetings.length,
    data: meetings
  });
});

// @desc    Get single meeting
// @route   GET /api/v1/meetings/:id
// @access  Public
exports.getMeeting = asyncHandler(async (req, res, next) => {  // Fixed: Changed from getMeetings to getMeeting
  const meeting = await Meeting.findById(req.params.id)
    .populate('creator', 'username email')
    .populate('participants', 'username email');

  if (!meeting) {
    return next(
      new ErrorResponse(`Meeting not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: meeting
  });
});

// @desc    Create new meeting
// @route   POST /api/v1/meetings
// @access  Private
exports.createMeeting = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.creator = req.user.id;

  // If it's a real-time meeting, add location
  if (req.body.type === 'real-time') {
    req.body.location = {
      type: 'Point',
      coordinates: [req.body.longitude, req.body.latitude],
      address: req.body.address
    };
  }

  const meeting = await Meeting.create(req.body);

  // Populate creator info in response
  const populatedMeeting = await Meeting.findById(meeting._id)
    .populate('creator', 'username email');

  res.status(201).json({
    success: true,
    data: populatedMeeting
  });
});

// @desc    Update meeting
// @route   PUT /api/v1/meetings/:id
// @access  Private
exports.updateMeeting = asyncHandler(async (req, res, next) => {
  let meeting = await Meeting.findById(req.params.id);

  if (!meeting) {
    return next(
      new ErrorResponse(`Meeting not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is meeting creator
  if (meeting.creator.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this meeting`,
        401
      )
    );
  }

  meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('creator', 'username email')
    .populate('participants', 'username email');

  res.status(200).json({
    success: true,
    data: meeting
  });
});

// @desc    Delete meeting
// @route   DELETE /api/v1/meetings/:id
// @access  Private
exports.deleteMeeting = asyncHandler(async (req, res, next) => {
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting) {
    return next(
      new ErrorResponse(`Meeting not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is meeting creator
  if (meeting.creator.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this meeting`,
        401
      )
    );
  }

  await meeting.deleteOne(); // Changed from remove() to deleteOne()

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Join a meeting
// @route   PUT /api/v1/meetings/:id/join
// @access  Private
exports.joinMeeting = asyncHandler(async (req, res, next) => {
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting) {
    return next(
      new ErrorResponse(`Meeting not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is already a participant
  if (meeting.participants.includes(req.user.id)) {
    return next(
      new ErrorResponse(`User ${req.user.id} is already in this meeting`, 400)
    );
  }

  // Add user to participants
  meeting.participants.push(req.user.id);
  await meeting.save();

  // Populate the updated meeting data
  const populatedMeeting = await Meeting.findById(meeting._id)
    .populate('creator', 'username email')
    .populate('participants', 'username email');

  res.status(200).json({
    success: true,
    data: populatedMeeting
  });
});

// @desc    Get meetings within a radius
// @route   GET /api/v1/meetings/radius/:zipcode/:distance
// @access  Private
exports.getMeetingsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const meetings = await Meeting.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  }).populate('creator', 'username email')
    .populate('participants', 'username email');

  res.status(200).json({
    success: true,
    count: meetings.length,
    data: meetings
  });
});