const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

/**
 * A user.
 */
const userSchema = new Schema({
  firstName: {
    type: String, // Type validation
    required: true, // Mandatory
    minlength: [ 2, 'First name is too short' ], // Minimum length
    maxlength: 20 // Maximum length
  },
  lastName: {
    type: String, // Type validation
    required: true, // Mandatory
    minlength: [ 2, 'Last name is too short' ], // Minimum length
    maxlength: 20 // Maximum length
  },
  role: {
    type: String, // Type validation
    required: true, // Mandatory
    enum: ["citizen","manager"],

  },
  createdAt: {
    type: Date,
    required: true, // Mandatory
    default: Date.now},
});
userSchema.index({ firstName: 1, lastName: 1  }, { unique: true });
