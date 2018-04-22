'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const soal = require('./data/soal.json');

var mongoose = require('mongoose');
var Game = require('./models/game');

require('dotenv').load();

const config = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET
}

// Initial

const app = express();
const client = new line.Client(config);

mongoose.connect('mongodb://taufanmahaputra:9wh4ck3r@ds147659.mlab.com:47659/budi-receh-bot');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Database connected');
});

app.get('*', (req, res) => {
	res.send('Budi Receh Webhook Service');
});

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  var user_id = event.source.userId;

  const echo = { 
  	type: 'text', 
  	text: ''
  };

  // create a response text message
  let input = event.message.text.toLowerCase();

	// Get question
	var qa_index = Math.floor(Math.random()*soal.random.length);
	var question_answer = soal.random[qa_index];

  if (input === 'nama')
		echo.text = `Hai, ${profile.displayName}`;
	else if (input === '/mulai') {
		Game.findOne({groupId: event.source.groupId}, (err, game) => {
			if (err)
				console.log(err);

			if (!game) {
				var newGame = new Game({
					groupId: event.source.groupId,
					question: question_answer.question,
				  answer: question_answer.answer,
				  idx: qa_index,
				  onGoing: true
				});
				
				newGame.save((err, result) => {
					if (err)
						console.log(err);

					console.log(result);
				});

				echo.text = 'Game dimulai. Pertanyaan: \n';
				echo.text += question_answer.question;
			} 
			else {
				if (game.onGoing)
					echo.text = 'Game sudah dimulai.';
				else {
					game.onGoing = true;
					
					while (qa_index == game.idx) {
						qa_index = Math.floor(Math.random()*soal.random.length);
					}

					question_answer = soal.random[qa_index];

					game.question = question_answer.question;
					game.answer = question_answer.answer;
					game.idx = qa_index;

					echo.text = 'Game dimulai. Pertanyaan: \n';
					echo.text += question_answer.question;
				}
			}
		});
	}
	else if (input === '/pass') {
		Game.findOne({groupId: event.source.groupId}, (err, game) => {
			if (err)
				console.log(err);

			if (!game) {
				echo.text = 'Game belum dimulai. Silahkan memulai permainan, sekararang!';
			} 
			else {
				while (qa_index == game.idx) {
					qa_index = Math.floor(Math.random()*soal.random.length);
				}

				question_answer = soal.random[qa_index];

				game.question = question_answer.question;
				game.answer = question_answer.answer;
				game.idx = qa_index;
				
				game.save((err, result) => {
					if (err)
						console.log(err);

					console.log(result);
				});

				echo.text = 'Payah! Pertanyaan baru: \n';
				echo.text += question_answer.question;
			}
		});
	}
	else if (input === '/stop') {
		Game.findOne({groupId: event.source.groupId}, (err, game) => {
			if (err)
				console.log(err);

			if (!game) {
				echo.text = 'Game belum dimulai. Silahkan memulai permainan, sekararang!';
			} 
			else {
				game.onGoing = false;
				game.save((err, result) => {
					if (err)
						console.log(err);

					console.log(result);
				});

				echo.text = 'Sampai jumpa lagi!';
			}
		});
	}
	else {
		Game.findOne({groupId: event.source.groupId}, (err, game) => {
			if (err)
				console.log(err);

			if (!game) {
				echo.text = 'Game belum dimulai. Silahkan memulai permainan, sekararang!';
			} 
			else {
				if (game.onGoing) {
					if (input === game.answer) {
						echo.text = 'Kamu berhasil nebak! Ketik /mulai untuk memulai kembali';

						game.onGoing = false;
						game.save((err, result) => {
							if (err)
								console.log(err);

							console.log(result);
						});
					}
				}
				else {
					echo.text = 'Game belum dimulai. Silahkan memulai permainan, sekararang!';
				}
			}
		});
	}

  // use reply API
  return client.replyMessage(event.replyToken, echo);

	// client.getProfile(user_id)
	//   .then((profile) => {

	//   })
	//   .catch((err) => {
	//     console.err(err);
	//     return 'Unknown';
	//   });
}

// listen on port
const port = process.env.PORT || 3000;
console.log(port);

app.listen(port, () => {
  console.log(`listening on ${port}`);
});
