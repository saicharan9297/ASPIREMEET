 
const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [50, 'Title cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['real-time', 'virtual'],
    required: [true, 'Please specify meeting type']
  },
  date: {
    type: Date,
    required: [true, 'Please add a date and time for the meeting']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: function() { return this.type === 'real-time'; }
    },
    coordinates: {
      type: [Number],
      required: function() { return this.type === 'real-time'; }
    },
    address: String
  },
  virtualLink: {
    type: String,
    required: function() { return this.type === 'virtual'; }
  },
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  participants: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }]
});

// Create meeting location index for geospatial queries
MeetingSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Meeting', MeetingSchema);