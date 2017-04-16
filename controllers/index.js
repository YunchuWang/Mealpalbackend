//Import Model
const Post = require('../models/Post');
const axios = require('axios');
const moment = require('moment');
const pusher = require('../pusherobj/pusher');
const numperpage = 9;
var last_id;
const timeformat = {
    sameDay: '[Today at] LT',
    nextDay: '[Tomorrow] LT',
    nextWeek: 'dddd LT',
    lastDay: '[Yesterday] LT',
    lastWeek: '[Last] dddd LT',
    sameElse: 'YYYY/MM/DD LT'
}

exports.helloworld = function(req,res) {
  res.send("hello world");
}

exports.getPost = (req,res) => {
  if(req.params.page <= 1) {
    Post.find().sort('-_id').limit(numperpage).exec(function(err, posts) {
      if (err) res.status(200).send({err:err});
      if(posts.length > 0) {
        last_id = posts[posts.length - 1]._id;
      }  else {
        last_id = 1000000000000000000000000;
      }
      posts = posts.map(function(post) {
        return {description:post.description,availtime:moment(post.time).calendar(null,timeformat),location:post.location,key:post.createdAt};
      });
      var newarr = [];
      var requests = [];
      for (var row = 0; row < posts.length; row++) {
        if(newarr.length < 3) {
          newarr.push(posts[row]);
        } else {
          requests.push(newarr);
          newarr = [];
          newarr.push(posts[row]);
        }
      }
      if(newarr.length > 0) requests.push(newarr);
      res.status(200).send({content:requests, length: posts.length});
    });
  } else {
    Post.find({'_id': {$lt:last_id}}).sort('-_id').limit(numperpage).exec(function(err, posts) {
      if (err) res.status(200).send({err:err});
      else {
        if(posts.length > 0) {
          last_id = posts[posts.length - 1]._id;
        } else {
          last_id = 1000000000000000000000000;
        }
        posts = posts.map(function(post) {
          return {description:post.description,availtime:moment(post.time).calendar(null,timeformat),location:post.location,key:post.createdAt};
        });
        var newarr = [];
        var requests = [];
        for (var row = 0; row < posts.length; row++) {
          if(newarr.length < 3) {
            newarr.push(posts[row]);
          } else {
            requests.push(newarr);
            newarr = [];
            newarr.push(posts[row]);
          }
        }
        if(newarr.length > 0) requests.push(newarr);
        res.status(200).send({content:requests, length: posts.length});
      }

    });
  }

}

exports.addPost = (req,res) => {
  var newPost = new Post({
    description: req.body.description,
    time: req.body.availtime,
    location: req.body.location
  });
  newPost.save((err,newPost)=>{
    if (err) return console.error(err);
    else {
      pusher.trigger('update-channel', 'update-event', {
        "message": "update"
      });
      res.status(200).send("pass");
    }
  });
  // res.status(200).send("yeah");
}
