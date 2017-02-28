const express = require('express');
const router = express.Router();
const Issue = require('../models/issue');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

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

 function loadIssueFromParamsMiddleware(req, res, next) {

   const issueId = req.params.id;
   if (!ObjectId.isValid(issueId)) {
     return issueNotFound(res, issueId);
  }

  query.exec(function(err, issue) {
    if (err) {
      return next(err);
    } else if (!issue) {
      return issueNotFound(res, issueId);
    }

    req.issue = issue;
    next();
  });
}


 module.exports = router;
