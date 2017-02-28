const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

/**
 * A user.
 */

 //Define a user schema
const userSchema = new Schema({
  firstName: {
    type: [String, 'First name is not a String'], // Type validation
    required: true,
    minlength: [ 2, 'First name is too short' ], // Minimum length
    maxlength: [20,'First name is too long' ]// Maximum length
  },
  lastName: {
    type: String, // Type validation
    required: true,
    minlength: [ 2, 'Last name is too short'], // Minimum length
    maxlength: [20,'Last name is too long'] // Maximum length
  },
  role: {
    type: String, // Type validation
    required: true,
    enum: ["citizen","manager"],

  },
  createdAt: {
    type: Date,
    default: Date.now},
});
userSchema.index({ firstName: 1, lastName: 1  }, { unique: true });


//Create the model from the schema and export it
module.exports = mongoose.model('User', userSchema);
