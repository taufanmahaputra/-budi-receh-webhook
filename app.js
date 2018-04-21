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
  var display_name = getDisplayName(user_id);

  // create a echoing text message
  let msg = event.message.text.toLowerCase() === 'nama' ? `Hai, ${display_name}` : event.message.text;

  const echo = { 
  	type: 'text', 
  	text: msg 
  };

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

// get display name by its userId
function getDisplayName(user_id) {
	client.getProfile(user_id)
	  .then((profile) => {
	  	console.log(profile);
	    return profile.displayName;
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