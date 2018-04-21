var mongoose = require('mongoose');

var gameSchema = mongoose.Schema({
	groupId: {type: String, unique: true},
	question: String,
  answer: String,
  idx: Number,
  onGoing: Boolean
});

module.exports = mongoose.model('Game', gameSchema);