const Pusher = require('pusher');
const pusher = new Pusher({
  appId: '322279',
  key: 'dbcd20122522e32d0f31',
  secret: '5d877ca6ea345cc149ab',
  encrypted: true
});


module.exports = pusher;
