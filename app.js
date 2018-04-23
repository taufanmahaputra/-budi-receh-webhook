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
	const echo = { 
  	type: 'text', 
  	text: 'error'
  };

  var user_id = event.source.userId;
  // create a response text message
  let input = event.message.text.toLowerCase();

	// Get question
	var qa_index = Math.floor(Math.random()*soal.random.length);
	var question_answer = soal.random[qa_index];

	if (event.type ===  'join') {
  	echo.text = 'Terima kasih telah menambahkan Budi sebagai teman receh kamu! (moon grin)' +
								'\nGame Budi Receh merupakan game tebak-tebak sederhana untuk melengkapi hari kamu haha.' +
								'\nBudi masih dalam tahap pengembangan, jadi Budi hanya dapat menerima command sederhana nih.' + 
								'\n /mulai : untuk memulai permainan' +
								'\n /pass  : untuk mengganti pertanyaan' +
								'\n /stop  : untuk menyudahi permainan' +
								'\n /keluar  : untuk mengeluarkan Budi :(' +
								'\n Soon Budi akan lebih banyak fiturnya. Sebarkan ke teman-teman kalian, ya!' +
								'\n\n Jika ada feedback, silahkan add @taufanmahaputra' +
								'Happy receh! (halloween)';
		return replyMessage(event, echo);
  }
	else if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }
  else {
  	if (input === '/mulai') {
			Game.findOne({groupId: event.source.groupId || event.source.roomId}, (err, game) => {
				if (err)
					console.log(err);

				if (!game) {
					var newGame = new Game({
						groupId: event.source.groupId || event.source.roomId,
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
						while (qa_index == game.idx) {
							qa_index = Math.floor(Math.random()*soal.random.length);
						}

						question_answer = soal.random[qa_index];

						game.question = question_answer.question;
						game.answer = question_answer.answer;
						game.idx = qa_index;
						game.onGoing = true;

						game.save((err, result) => {
							if (err)
									console.log(err);

							console.log(result);
						});

						echo.text = 'Game dimulai. Pertanyaan: \n';
						echo.text += question_answer.question;
					}
				}
				replyMessage(event, echo);
			});
		}
		else if (input === '/pass') {
			Game.findOne({groupId: event.source.groupId || event.source.roomId}, (err, game) => {
				if (err)
					console.log(err);

				if (!game) {
					echo.text = 'Game belum dimulai. Silahkan memulai permainan, sekarang!';
				} 
				else {
					if (game.onGoing) {
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
					else {
						echo.text = 'Game belum dimulai. Silahkan memulai permainan, sekarang!';
					}
				}
				replyMessage(event, echo);
			});
		}
		else if (input === '/stop') {
			Game.findOne({groupId: event.source.groupId || event.source.roomId}, (err, game) => {
				if (err)
					console.log(err);

				if (!game) {
					echo.text = 'Game belum dimulai. Silahkan memulai permainan, sekarang!';
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
				replyMessage(event, echo);
			});
		}
		else if (input === '/keluar') {
		  var promise1 = Promise.resolve(event);

			promise1.then(function(event) {
			  echo.text = 'Terima kasih udah ajak Budi main! Maaf Budi ngeselin ya hehe. Kapan-kapan ajak Budi main lagi yaa';
				replyMessage(event, echo);
			  
			  return event;
			}).then(function(event) {
			  client.leaveGroup(event.source.groupId)
				  .then(() => {
				  	//set on going false
				  	Game.findOne({groupId: event.source.groupId || event.source.roomId}, (err, game) => {
							if (err)
								console.log(err);

							if (game) {
								game.onGoing = false;
								game.save((err, result) => {
									if (err)
										console.log(err);

									console.log(result);
								});
							}
						});
				  })
				  .catch((err) => {
				    // error handling
				    console.log(err);
				  });
			});

		}
		else {
			Game.findOne({groupId: event.source.groupId || event.source.roomId}, (err, game) => {
				if (err)
					console.log(err);

				if (game) {
					if (game.onGoing) {
						console.log(input);
						console.log(game.answer);

						if (input === game.answer.toLowerCase()) {
							echo.text = 'Kamu berhasil nebak! Ketik /mulai untuk memulai kembali';

							game.onGoing = false;
							game.save((err, result) => {
								if (err)
									console.log(err);

								console.log(result);
							});

							replyMessage(event, echo);
						}
					}
				}
			});
		}
  }

}

function replyMessage(event, echo) {
	// use reply API
  return client.replyMessage(event.replyToken, echo);
}

	// client.getProfile(user_id)
	//   .then((profile) => {

	//   })
	//   .catch((err) => {
	//     console.err(err);
	//     return 'Unknown';
	//   });


// listen on port
const port = process.env.PORT || 3000;
console.log(port);

app.listen(port, () => {
  console.log(`listening on ${port}`);
});
