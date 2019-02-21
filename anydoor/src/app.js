const http = require('http');
const chalk = require('chalk');
const path = require('path');
const conf = require('./config/defaultConfig');
const route = require('./helper/route');

class Server {
  constructor(config) {
    this.conf = Object.assign({}, conf, config);
  }

  start() {
    const server = http.createServer((req, res) => {
      const filePath = path.join(this.conf.root, req.url);//req.url地址栏端口号之后的部分
      route(req, res, filePath, this.conf);
    });

    server.listen(this.conf.port, this.conf.hostname, () => {
      const addr = `http:\/\/${this.conf.hostname}:${this.conf.port}`;
      console.info(`Server started at ${chalk.green(addr)}`);
    });
  }
}

module.exports = Server;
