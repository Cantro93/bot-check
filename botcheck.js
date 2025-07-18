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
    this.fs = require('fs');
    this.joinPath = require('path').join;
    this.connections = new Map();
    // css should use only selectors using element tags or input's type attribute - everything else is randomized
    this.css = css;
    // as time is compared in milliseconds, conversion from seconds is required
    this.timing = time*1000;

    this.templates = [];
    this.loadTemplate('./templates/basic.1.html');
    this.loadTemplate('./templates/basic.2.html');
    this.loadTemplate('./templates/4-answer.1.html');
    this.loadTemplate('./templates/4-answer.2.html');
    this.loadTemplate('./templates/4-answer.3.html');
    this.loadTemplate('./templates/4-answer.4.html');
  }
  //generate new session entry
  mkSession() {
    return {
      id: this.mkRandom(),
      gr: this.mkRandom(),
      br: this.mkRandom(),
      state: "pending",
      time: Date.now(),
      perm: false
    };
  }
  loadTemplate(filename)
  {
    this.templates.push(this.fs.readFileSync(this.joinPath(__dirname, filename), 'utf8'));
  }
  getTemplate()
  {
    let t = this.templates.shift();
    this.templates.push(t);
    return t;
  }
  // generate random hex strings
  mkRandom()
  {
    return Math.random().toString(16).substring(2);
  }
  sessionExpired(sess)
  {
    if (sess != undefined && sess != null) {
      console.log(`${JSON.stringify(sess)}`);
      if (Object.hasOwn(sess, 'time')) {
        console.log(`${(sess.time+this.timing)/1000} > ${Date.now()/1000}? ${sess.time+this.timing > Date.now()}`)
        return sess.time+this.timing > Date.now();
      }
    };
    return false;
  }
  auth(req, data, https)
  {
    let ip = req.socket.remoteAddress;
    console.log(`Request from ${ip}`);
    // this complicated if checks whether entry for this IP exists and if it has expired
    if (this.connections.has(ip) && this.sessionExpired(this.connections.get(ip)))
    {
      let sess = this.connections.get(ip);
      console.log(`${ip}: Found session: ${sess}. Session expires on ${new Date(sess.time+this.timing)}. Now is ${new Date(Date.now())}`);
      // record exists and timeout has not occurred
      if (req.url.includes(`${sess.id}/info`) || req.url.includes(`${sess.id}/data`)) {
        sess.state = "reject";
        sess.perm = true;
        console.log(`${ip}: ${sess.id}: connection ${sess.state}ed.`);
        return {state: "reject", body: ""};
      };
      if (sess.state == "pending") {
        // record required evaluation, now it will be done
        if (data.includes(`${sess.id}=${sess.gr}`)) {

          sess.state = "accept";
        }
        else {
          sess.state = "reject";
        }
        console.log(`${ip}: ${sess.id}: connection ${sess.state}ed`);
      };
      return {state: sess.state, body: ""};
    }
    else {
      if (this.connections.has(ip)) {
        let sess = this.connections.get(ip);
        console.log(`${ip}: Found session: ${sess}. Session expires on ${new Date(sess.time+this.timing)}. Now is ${new Date(Date.now())}`);
        if (sess.perm) {
          console.log(`${ip}: ${sess.id}: connection ${sess.state}ed.`);
          return {state: this.connections.get(ip).state, body: ""};
        }
        // clear entry if timeout occurred
        else { console.log(`${ip}: ${sess.id}: connection rejected. Session expired`);}
      }
      let sess = this.mkSession();
      let rand1 = this.mkRandom();
      let rand2 = this.mkRandom();
      this.connections.set(ip, sess);
      return {
        state: "do_auth",
        // choose next form template
        body: eval('`' + this.getTemplate() + '`')
      };
    }
  }
};

module.exports = BotCheck;
