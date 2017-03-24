const mongoose = require('mongoose');
const postSchema = mongoose.Schema({
  description: {type: String, required: true},
  time: {type: String, required: true},
  location: {type: String, required: true}
},{ timestamps: true })

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
