const mongoose = require('mongoose');
const postSchema = mongoose.Schema({
  description: String,
  time: String,
  location: String
})

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
