const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const promisify = require('util').promisify;
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const mime = require('./mime');
const compress = require('./compress');
const range = require('./range');
const isFresh = require('./cache');

const tplPath = path.join(__dirname, '../template/dir.tpl');//__dirname正在编辑文件的绝对地址
const source = fs.readFileSync(tplPath);
const template = Handlebars.compile(source.toString());

module.exports = async function (req, res, filePath, config) {
  try {
    const stats = await stat(filePath);//获取文件信息
    if (stats.isFile()) {
      const contentType = mime(filePath);
      res.setHeader('Content-Type', contentType);

      if (isFresh(stats, req, res)) {//false则要请求最新的资源
        res.statusCode = 304;
        res.end();
        return;
      }

      let rs;
      const {code, start, end} = range(stats.size, req, res);//stats.size文件大小
      if (code === 200) {
        res.statusCode = 200;
        rs = fs.createReadStream(filePath);//读取文件内容
      } else {
        res.statusCode = 206;
        rs = fs.createReadStream(filePath, {start, end});
      }
      if (filePath.match(config.compress)) {
        rs = compress(rs, req, res);
      }
      rs.pipe(res);
    } else if (stats.isDirectory()) {
      const files = await readdir(filePath);//读取目录的内容
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      const dir = path.relative(config.root, filePath);
      const data = {
        title: path.basename(filePath),//path.basename返回 path 的最后一部分
        dir: dir ? `/${dir}` : '',
        files: files.map(file => {
          return {
            file,
            icon: mime(file)
          }
        })
      };
      res.end(template(data));
    }
  } catch (ex) {
    console.error(ex);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`${filePath} is not a directory or file\n ${ex.toString()}`);
  }
}
