const express = require('express');
const router = express.Router();
const Issue = require('../models/issue');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const _ = require('lodash');

 /* GET issues listing. */
 router.get('/', function(req, res, next) {
   //Find all issues in the db and sort it by status
   Issue.find().sort('status').exec(function(err, issues) {
     if (err) {
       return next(err);
     }
     res.send(issues);
   });
 });

 /* GET an issue */
 router.get('/:id', loadIssueFromParamsMiddleware, function(req, res, next) {
  res.send(req.issue);
});

 /* DELETE an issue with a given ID */
 router.delete('/:id', loadIssueFromParamsMiddleware, function(req, res, next) {
  req.issue.remove(function(err) {
    if(err) {
      return next(err);
    }
    return res.sendStatus(204);
  });
});

 /* POST new issue */
 router.post('/', function(req, res, next) {
   const newIssue = new Issue(req.body);
   // Save issue
   newIssue.save(function(err, savedIssue) {
     if (err) {
       return next(err);
     }
     // Send the saved document in the response
     res.send(savedIssue);
   });
 });

 /* PATCH an issue */
 router.patch('/:id', loadIssueFromParamsMiddleware, function(req, res, next) {

  // Update a property or several

  // Update status
  if (  req.issue.status !== undefined) {
        req.issue.status = req.body.status;
    };

  _.assignIn(req.issue, req.body);


  req.issue.status = req.body.status;
  req.issue.description = req.body.description;
  req.issue.imageUrl = req.body.imageUrl;
  req.issue.latitude = req.body.latitude;
  req.issue.longitude = req.body.longitude;
  req.issue.tags = req.body.tags;
  req.issue.user = req.body.user;
  req.issue.updatedAt = Date.now;

  req.issue.save(function(err, savedIssue) {
    if (err) {
      return next(err);
    }

    debug(`Updated issue "${savedIssue.description}"`);
    res.send(savedIssue);
  });
});

 /**
  * Responds with 404 Not Found if the ID is not valid or the person doesn't exist.
  */
 function loadIssueFromParamsMiddleware(req, res, next) {

   const issueId = req.params.id;
   if (!ObjectId.isValid(issueId)) {
     return issueNotFound(res, issueId);
   }

   Issue.findById(req.params.id, function(err, issue) {
     if (err) {
       return next(err);
     } else if (!issue) {
       return issueNotFound(res, issueId);
     }

     req.issue = issue;
     next();
   });
 }

 /**
  * Responds with 404 Not Found and a message indicating that the issue with the specified ID was not found.
  */
 function issueNotFound(res, issueId) {
   return res.status(404).type('text').send(`No issue found with ID ${issueId}`);
 }

 module.exports = router;
