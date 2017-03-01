var express = require('express');
var router = express.Router();
const User = require('../models/user');
const Issue = require('../models/issue');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const _ = require('lodash');

/* GET users listing. */
router.get('/', function(req, res, next) {
  //Find all the users in the db and sort it by lastName
  User.find().sort('lastName').exec(function(err, users) {
    if (err) {
      return next(err);
    }

    // Get the documents' IDs
    const userIds = users.map(user => user._id);


    //Aggregation to count issues of each users
    Issue.aggregate([
      {
        $match: { // Select issues reported by the people we are interested in
          user: { $in: userIds }
        }
      },
      {
        $group: { // Group the documents by user ID
          _id: '$user',
          issueCount: { // Count the number of issues for that ID
            $sum: 1
          }
        }
      }
    ], function(err, results) {
      if (err) {
        return next(err);
      }
        // Convert the Person documents to JSON
        const userJson = users.map(user => user.toJSON());

        // For each result...
        results.forEach(function(result) {
          // Get the user ID (that was used to $group)...
          const resultId = result._id.toString();
          // Find the corresponding person...
          const correspondingUser = userJson.find(user => user._id == resultId);
          // And attach the new property
          correspondingUser.reportedIssueCount = result.issueCount;

        });
        // Send the enriched response
        res.send(userJson);
    });
    //res.send(users);
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

/* PATCH Update a user */
router.patch('/:id', loadUserFromParamsMiddleware, function(req, res, next) {

  // Update a property or several
  const whitelist = _.pick(req.body, ['firstName', 'lastName', 'role']); //create a whitelist of properties to be changed
  _.assignIn(req.user, whitelist);

  req.user.save(function(err, savedUser) {
    if (err) {
      return next(err);
    }

    res.send(savedUser);
  });
});

/* DELETE one user */
router.delete('/:id', loadUserFromParamsMiddleware, function(req, res, next) {
  req.user.remove(function(err) {
    if (err) {
      return next(err);
    }
    res.sendStatus(204);
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
