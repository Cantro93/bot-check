# bot-check

## About

This module will help verify if the traffic comes from bots or humans.

It's neither hogging on client's resources like Anubis nor gathering information like reCAPTCHA, and is free software distributed under LGPL 2.1.

## Features

- simple radio button form easy for human users to use;
- storing only IP;
- no JS on client-side;
- fields and values randomized;
- asks for verification only every specified interval;
- no need of redirection in purpose of verification;
- should be working with HTTPS;
- customizable with CSS;
- hosted directly on your server, as Node.js module.

## To do

- [ ] make function that will be used as event listener for server `request` event;
- [ ] make npm package.

## Installation

Put file botcheck.js into any place in your project, and write down relative path in your `require` clause.

## Usage (HTTP sample)

```js
const http = require('http');
const BotCheck = require('./botcheck');

// create new bot checker instance, with interval of 5 hours (18000 s) and no CSS
global.bc = new BotCheck(18000, '');

const server = http.createServer((req,res) => {
  // BotCheck will need access to body of POST request 
  let data = '';
  req.on('data', chunk => {data += chunk.toString();});
  req.on('end', () => {

    // this object contains information how to treat that request
    const auth_result = global.bc.auth(req, data, false);

    // auth_result.state values and their meaning were describe in
    switch (auth_result.state) {
      case 'accept':
        // as this request comes from human, serve content as normally
      case 'reject':
        // your response to bots should go here
        break;
      case 'do_auth':
        res.writeHead(200, {'Content-Type': 'text/html', 'Location': 'verify.html'});
        // auth_result.body contains HTML form to be filled by client
        res.end(auth_result.body);
        break;
      default:
        break;
    }
  });
});

server.listen(1080, 'localhost', () => {console.log("server started")});
```
