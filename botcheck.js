/*
BotCheck
    Copyright (C) 2025  Antoni Soltys

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Lesser General Public
    License as published by the Free Software Foundation; either
    version 2.1 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public
    License along with this library; if not, write to the Free Software
    Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301
    USA
*/

class BotCheck
{
  constructor(time, css)
  {
    this.connections = new Map();
    // css should use only selectors using element tags or input's type attribute - everything else is randomized
    this.css = css;
    // as time is compared in milliseconds, conversion from seconds is required
    this.timing = time*1000;
  }
  //generate new session entry
  mkSession() {
    return {
      id: this.mkRandom(),
      gr: this.mkRandom(),
      br: this.mkRandom(),
      state: "pending",
      time: Date.now()
    };
  }
  // generate random hex strings
  mkRandom()
  {
    return Math.random().toString(16).substring(2);
  }
  auth(req, data, https)
  {
    let ip = req.socket.remoteAddress;
    if (this.connections.has(ip) && (this.connections.has(ip)?.time != undefined && this.connections.has(ip)?.time != null ? this.connections.has(ip).time : 0)+this.timing < Date.now()) {
      // record exists and timeout has not occurred
      if (this.connections.get(ip).state == "pending") {
        // record required evaluation, now it will be done
        let sess = this.connections.get(ip);
        if (data.includes(`${sess.id}=${sess.gr}`)) {
          sess.state = "accept";
        }
        else {
          sess.state = "reject";
        }

      }
      return {state: this.connections.get(ip).state, body: ""};
    }
    else {
      if (this.connections.has(ip)) {
        // clear entry if timeout occurred
        this.connections.set(ip, {});
      }
      let sess = this.mkSession();
      let rand1 = this.mkRandom();
      let rand2 = this.mkRandom();
      this.connections.set(ip, sess);
      return {
        state: "do_auth",
        // below is the form template
        body: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <meta http-equiv="X-UA-Compatible" content="ie=edge"/>
          <title>Bot Verification</title>
          <style>
            ${this.css}
          </style>
        </head>
        <body>
          <form action="http${https ? 's' : ''}://${req.headers.host}${req.url}" method="post">
            <label for="${rand2}">I am a robot</label>
            <input type="radio" name="${sess.id}" value="${sess.br}" id="${rand2}" checked/>
            <br>
            <label for="${rand1}">I am not a robot</label>
            <input type="radio" name="${sess.id}" value="${sess.gr}" id="${rand1}"/>
            <input type="submit" value="Submit"/>
          </form>
          <p><a href="https://github.com/Cantro93/bot-check">Source Code</a></p>
        </body>
        </html>
        `
      };
    }
  }
};

module.exports = BotCheck;
