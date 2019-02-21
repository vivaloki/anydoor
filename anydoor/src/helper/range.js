module.exports = (totalSize, req, res) => {
  const range = req.headers['range'];//Range 是一个请求首部，告知服务器返回文件的哪一部分,Range: bytes=200-1000, 2000-6576, 19000-
  if (!range) {
    return {code: 200};
  }

  const sizes = range.match(/bytes=(\d*)-(\d*)/);
  const end = sizes[2]? parseInt(sizes[2]) : totalSize - 1;
  const start = sizes[1]? parseInt(sizes[1]) : totalSize - end;

  if (start > end || start < 0 || end > totalSize) {
    return {code: 200};
  }

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
  res.setHeader('Content-Length', end - start);
  return {
    code: 206,
    start: start,
    end: end
  };
};
