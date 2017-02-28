const mongoose = require('mongoose');
  const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

/**
 * An issue declared by a user.
 */
const issueSchema = new Schema({
  status: {
    type: String,
    required: true,
    enum: [ 'new', 'inProgress', 'canceled', 'completed' ],
    default: "new"
  },
  description: {
    type: String,
    maxlength: 1000 // Maximum length
  },
  imageUrl: {
    type: String,
    maxlength: 500
  },
  latitude: {
    type: Number,
    required: true,
    min: 0,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  tags: {
    type: [String],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updateddAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    validate: {
     // Validate that the user is a valid ObjectId (exsit)
     validator: validateUser
   }
  }
});

//validate if user exist
function validateUser(value, callback) {
  mongoose.model('User').findOne({ _id: ObjectId(value) }).exec(function(err, user) {
    if (err || !user) {
      return next(err);
    }
    callback();
  });
}

module.exports = mongoose.model('Issue', issueSchema);
