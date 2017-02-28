const express = require('express');
const router = express.Router();
const Issue = require('../models/issue');
//const ObjectId = mongoose.Types.ObjectId;

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

 module.exports = router;
