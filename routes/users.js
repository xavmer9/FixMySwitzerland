var express = require('express');
var router = express.Router();
const User = require('../models/user');
const Issue = require('../models/issue');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

/* GET users listing. */
router.get('/', function(req, res, next) {
  //Find all the users in the db and sort it by name
  User.find().sort('name').exec(function(err, users) {
    if (err) {
      return next(err);
    }
    res.send(users);
  });
});


/* POST new user */
router.post('/', function(req, res, next) {
  // Create a new document from the JSON in the request body
  const newUser = new User(req.body);
  // Save the document
  newUser.save(function(err, savedUser) {
    if (err) {
      return next(err);
    }
    // Send the saved document in the response
    res.send(savedUser);
  });
});


/* GET one user */
router.get('/:id', loadUserFromParamsMiddleware, function(req, res, next) {
    res.send(req.person);
});

/* GET all issues from a user */
router.get('/:id/issues', loadUserFromParamsMiddleware, function(req, res, next) {
  Issue.find().sort('updatedAt').exec(function(err, issues) {
    if (err) {
      return next(err);
    }
    //console.log(issues);
    res.send(issues);
  });
});

/**
 * Middleware that loads the person corresponding to the ID in the URL path.
 * Responds with 404 Not Found if the ID is not valid or the person doesn't exist.
 */
function loadUserFromParamsMiddleware(req, res, next) {

  const userId = req.params.id;
  if (!ObjectId.isValid(userId)) {
    return userNotFound(res, userId);
  }

  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return userNotFound(res, userId);
    }

    req.user = user;
    next();
  });
}

/**
 * Responds with 404 Not Found and a message indicating that the person with the specified ID was not found.
 */
function userNotFound(res, userId) {
  return res.status(404).type('text').send(`No user found with ID ${userId}`);
}

module.exports = router;
