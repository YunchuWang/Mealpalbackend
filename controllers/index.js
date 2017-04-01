//Import Model
const Post = require('../models/Post');
const axios = require('axios');
const moment = require('moment');
const Pusher = require('pusher');
// Meal Pal restful apis
const timeformat = {
    sameDay: '[Today at] LT',
    nextDay: '[Tomorrow] LT',
    nextWeek: 'dddd LT',
    lastDay: '[Yesterday] LT',
    lastWeek: '[Last] dddd LT',
    sameElse: 'YYYY/MM/DD LT'
}

var pusher = new Pusher({
  appId: '322279',
  key: 'dbcd20122522e32d0f31',
  secret: '5d877ca6ea345cc149ab',
  encrypted: true
});

exports.helloworld = function(req,res) {
  res.send("hello world");
}

exports.getPost = (req,res) => {
  // axios.post('https://onyen.unc.edu/cgi-bin/unc_id/authenticator.pl').then(function(res){
  //   console.log(res);
  // }).catch(function (error) {
  //   console.log(error);
  // });
  // console.log(req);
  Post.find({}).sort('-createdAt').limit(10).exec(function(err, posts) {
    if (err) return next(err);
    // console.log(posts);
    posts = posts.map(function(post) { return {description:post.description,availtime:moment(post.time).calendar(null,timeformat),location:post.location,key:post.createdAt}; });

    var newarr = [];
    var requests = [];
    for (var row = 0; row < posts.length; row++) {
      if(newarr.length < 3) {
        newarr.push(posts[row]);
      } else {
        requests.push(newarr);
        newarr = [];
      }
    }
    if(newarr.length > 0) requests.push(newarr);
    res.status(200).send({content:requests, length: posts.length});
  });
  // Post.find({}, function(err, posts) {
  //   if (err) return next(err);
  //   console.log(posts);
  //   res.send(posts);
  // });
}

exports.addPost = (req,res) => {
  // console.log("asdlkasj");
  // console.log(req.body);
  // console.dir(req);
  var newPost = new Post({
    description: req.body.description,
    time: req.body.availtime,
    location: req.body.location
  });
  newPost.save((err,newPost)=>{
    if (err) return console.error(err);
    // console.dir(newPost);
  });
  pusher.trigger('request-channel', 'request-event', {
    "message": "update"
  });
  res.status(200).send("yeah");
}
