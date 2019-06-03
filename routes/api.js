/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var ObjectId = require('mongodb').ObjectId;

module.exports = function (app, db) {

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      
      db.collection('books').aggregate([{$project: {
        _id: true,
        title: true,
        commentcount: { $size:"$comments" }
      }}]).toArray()
        .then(docs => docs.length ? res.json(docs) : res.send("no book exists"))
        .catch(err => res.send(err));
    })
    
    .post(function (req, res){
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
    
      if (!title) return res.send("Please input title");
    
      // If I find book called *title*, do nothing. Else upsert it. Either way, return updated doc.
      db.collection("books").findOneAndUpdate(
        {title},
        {$setOnInsert: {title, comments: []}},
        {upsert: true, returnOriginal: false}
      )
      .then(result => res.json(result.value))
      .catch(err => res.send(err));
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
    
      db.dropCollection("books")
      .then(result => res.send("complete delete successful"))
      .catch(err => res.send(err));
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    
      let obId;
      try {
        obId = ObjectId(bookid);
      } catch(err) {
        return res.send('no such book exists');
      }
    
      db.collection("books").findOne({_id: obId})
      .then(doc => doc ? res.json(doc) : res.send('no such book exists'))
      .catch(err => res.send(err));
    })
    
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get
    
      if (!comment) return res.send("please write a comment");
    
      let obId;
      try {
        obId = ObjectId(bookid);
      } catch(err) {
        return res.send('no such book exists');
      }
    
      db.collection("books").findOneAndUpdate(
        {_id: obId},
        // would have been {$push: {comments: comment}} but I
        // wanted to unshift and that's how that's done
        {$push: { comments: {$each: [comment], $position: 0}}},
        {returnOriginal: false}
      )
      .then(result => result.value ? res.json(result.value) : res.send('no such book exists'))
      .catch(err => res.send(err));
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
    
      let obId;
      try {
        obId = ObjectId(bookid);
      } catch(err) {
        return res.send('no such book exists');
      }
    
      db.collection("books").findOneAndDelete({_id: obId})
      .then(doc => doc ? res.send("delete successful") : res.send('no such book exists'))
      .catch(err => res.send(err));
    });
  
};
