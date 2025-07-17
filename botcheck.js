class BotCheck
{
  constructor(time, css)
  {
    this.connections = new Map();
    this.css = css;
    this.timing = time*1000;
  }
  mkSession() {
    return {
      id: this.mkRandom(),
      gr: this.mkRandom(),
      br: this.mkRandom(),
      state: "pending",
      time: Date.now()
    };
  }
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
        </body>
        </html>
        `
      };
    }
  }
};

module.exports = BotCheck;
