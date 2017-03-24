//Import Model
const Post = require('../models/Post');
const axios = require('axios');
// Meal Pal restful apis
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
  Post.find({}).sort('-createdAt').exec(function(err, posts) {
    if (err) return next(err);
    // console.log(posts);
    posts = posts.map(function(post) { return {description:post.description,availtime:post.time,location:post.location,key:post.createdAt}; });

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
  res.status(200).send("yeah");
}
