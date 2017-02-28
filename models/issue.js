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
    type: Schema.Types.UserId,
    ref: 'User',
    default: null
  }
});

/**
 * Add a virtual "directorHref" property:
 *
 * * "movie.directorHref" will return the result of calling getDirectorHref with the movie as this
 * * "movie.directorHref = value" will return the result of calling setDirectorHref with the movie as this and value as an argument
 */
movieSchema.virtual('directorHref').get(getDirectorHref).set(setDirectorHref);

// Customize the behavior of movie.toJSON() (called when using res.send)
movieSchema.set('toJSON', {
  transform: transformJsonMovie, // Modify the serialized JSON with a custom function
  virtuals: true // Include virtual properties when serializing documents to JSON
});

/**
 * Given a person ID, ensures that it references an existing person.
 *
 * If it's not the case or the ID is missing or not a valid object ID,
 * the "directorHref" property is invalidated instead of "director".
 * (That way, the client gets an error on "directorHref", which is the
 * property they sent, rather than "director", which they don't know.)
 */
function validateDirector(value, callback) {
  if (!value && !this._directorHref) {
    this.invalidate('directorHref', 'Path `directorHref` is required', value, 'required');
    return callback();
  } else if (!ObjectId.isValid(value)) {
    this.invalidate('directorHref', 'Path `directorHref` is not a valid Person reference', this._directorHref, 'resourceNotFound');
    return callback();
  }

  mongoose.model('Person').findOne({ _id: ObjectId(value) }).exec(function(err, person) {
    if (err || !person) {
      this.invalidate('directorHref', 'Path `directorHref` does not reference a Person that exists', this._directorHref, 'resourceNotFound');
    }

    callback();
  });
}

/**
 * Given a title, calls the callback function with true if no movie exists with that title
 * (or the only movie that exists is the same as the movie being validated).
 */
function validateMovieTitleUniqueness(value, callback) {
  const movie = this;
  this.constructor.findOne().where('title').equals(value).exec(function(err, existingMovie) {
    callback(!err && (!existingMovie || existingMovie._id.equals(movie._id)));
  });
}

/**
 * Returns the hyperlink to the movie's director.
 * (If the director has been populated, the _id will be extracted from it.)
 */
function getDirectorHref() {
  return `/api/people/${this.director._id || this.director}`;
}

/**
 * Sets the movie's director from a person hyperlink.
 */
function setDirectorHref(value) {

  // Store the original hyperlink
  this._directorHref = value;

  // Remove "/api/people/" from the beginning of the value
  const personId = value.replace(/^\/api\/people\//, '');

  if (ObjectId.isValid(personId)) {
    // Set the director if the value is a valid MongoDB ObjectId
    this.director = personId;
  } else {
    // Unset the director otherwise
    this.director = null;
  }
}

/**
 * Removes extra MongoDB properties from serialized movies,
 * and includes the director's data if it has been populated.
 */
function transformJsonMovie(doc, json, options) {

  // Remove MongoDB _id & __v (there's a default virtual "id" property)
  delete json._id;
  delete json.__v;

  if (json.director instanceof ObjectId) {
    // Remove the director property by default (there's a "directorHref" virtual property)
    delete json.director;
  } else {
    // If the director was populated, include it in the serialization
    json.director = doc.director.toJSON();
  }

  return json;
}

module.exports = mongoose.model('Issue', issueSchema);
