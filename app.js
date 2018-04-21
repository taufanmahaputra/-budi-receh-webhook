'use strict';

const line = require('@line/bot-sdk');
const express = require('express');

require('dotenv').load();

const config = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET
}

// Initial

const app = express();
const client = new line.Client(config);

app.get('*', (req, res) => {
	res.send('Budi Receh Webhook Service');
});

app.post('/webhook', line.middleware(config), (req, res) => {

	console.log(req.body.events);

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

	client.getProfile(user_id)
	  .then((profile) => {
	    // create a echoing text message
  		echo.text = event.message.text.toLowerCase() === 'nama' ? `Hai, ${profile.displayName}` : event.message.text;

		  // use reply API
		  return client.replyMessage(event.replyToken, echo);
	  })
	  .catch((err) => {
	    console.err(err);
	    return 'Unknown';
	  });
}

// listen on port
const port = process.env.PORT || 3000;
console.log(port);

app.listen(port, () => {
  console.log(`listening on ${port}`);
});