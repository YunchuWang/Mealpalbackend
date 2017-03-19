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
  Post.find({}).sort('-time').exec(function(err, posts) {
    if (err) return next(err);
    // console.log(posts);
    res.status(200).send(posts);
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
  var newPost = new Post({
    description: req.body.description,
    time: req.body.availtime,
    location: req.body.location
  });
  newPost.save((err,newPost)=>{
    if (err) return console.error(err);
    console.dir(newPost);
  });
  res.status(200).send("yeah");
}
