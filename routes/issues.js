const express = require('express');
const router = express.Router();
const Issue = require('../models/issue');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const _ = require('lodash');
const formatLinkHeader = require('format-link-header');



router.get('/', function(req, res, next) {

  // Count total movies matching the URL query parameters
  const countQuery = queryIssues(req);
  countQuery.count(function(err, total) {
    if (err) {
      return next(err);
    }

    // Prepare the initial database query from the URL query parameters
    let query = queryIssues(req);

    // Paginate
    query = paginate('/issues', query, total, req, res);

    // Execute the query
    query.sort({ title: 1 }).exec(function(err, issues) {
      if (err) {
        return next(err);
      }

      res.send(issues);
    });
  });
});

 /**
  * Returns a Mongoose query that will retrieve issues filtered with the URL query parameters.
  */
 function queryIssues(req) {

  let query = Issue.find();

  if (Array.isArray(req.query.user)) {
    const users = req.query.user.filter(ObjectId.isValid);
    query = query.where('user').in(users);
  } else if (ObjectId.isValid(req.query.user)) {
    query = query.where('user').equals(req.query.user);
  }

  if (!isNaN(req.query.status)) {
    query = query.where('status').equals(req.query.status);
  }
  return query;
}

/**
 * Paginates a database query and adds a Link header to the response (if applicable).
 *
 * @param {String} resourceHref - The hyperlink reference of the collection (e.g. "/api/people")
 * @param {MongooseQuery} query - The database query to paginate
 * @param {Number} total - The total number of elements in the collection
 * @param {ExpressRequest} req - The Express request object
 * @param {ExpressResponse} res - The Express response object
 * @returns The paginated query
 */
function paginate(resourceHref, query, total, req, res) {

  // Parse the "page" URL query parameter indicating the index of the first element that should be in the response
  let page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  // Parse the "pageSize" URL query parameter indicating how many elements should be in the response
  let pageSize = parseInt(req.query.pageSize, 10);
  if (isNaN(pageSize) || pageSize < 0 || pageSize > 100) {
    pageSize = 100;
  }

  // Apply the pagination to the database query
  query = query.skip((page - 1) * pageSize).limit(pageSize);

  const links = {};
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || '3000'}`;
  const url = baseUrl + resourceHref;
  const maxPage = Math.ceil(total / pageSize);

  // Add first & prev links if current page is not the first one
  if (page > 1) {
    links.first = { rel: 'first', url: `${url}?page=1&pageSize=${pageSize}` };
    links.prev = { rel: 'prev', url: `${url}?page=${page - 1}&pageSize=${pageSize}` };
  }

  // Add next & last links if current page is not the last one
  if (page < maxPage) {
    links.next = { rel: 'next', url: `${url}?page=${page + 1}&pageSize=${pageSize}` };
    links.last = { rel: 'last', url: `${url}?page=${maxPage}&pageSize=${pageSize}` };
  }

  // If there are any links (i.e. if there is more than one page),
  // add the Link header to the response
  if (Object.keys(links).length >= 1) {
    res.set('Link', formatLinkHeader(links));
  }

  return query;
};

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
  const whitelist = _.pick(req.body, ['status', 'description', 'imageUrl', 'latitude', 'longitude', 'updatedAt']); //create a whitelist of properties to be changed
  _.assignIn(req.issue, whitelist);

  req.issue.save(function(err, savedIssue) {
    if (err) {
      return next(err);
    }
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
