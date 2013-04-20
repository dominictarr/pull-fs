var pull = require('pull-stream')
var fs   = require('fs')
var path = require('path')
var split = require('pull-split')

var readdir =
exports.readdir =
pull.Source(function (dir) {
  var ls, ended = false
  return function (abort, cb) {
    if(ended || abort) {
      cb(ended = ended || abort)
    }
    else if(!ls)
      fs.readdir(dir, function (err, _ls) {
        if(err)             cb(ended = err)
        else if(!_ls.length) cb(ended = true)
        else {
          ls = _ls.map(function (f) {
            return path.resolve(dir, f)
          })
          cb(null, ls.shift())
        }
      })
    else if(!ls.length) cb(ended = true)
    else                cb(null, ls.shift())  
  }
})

var blocksize = 512

var read = 
exports.read =
pull.Source(function (path, options) {

  //C/P from
  // https://github.com/joyent/node/blob/master/lib/fs.js#L172-L202
  /*
    [fs.js](https://github.com/joyent/node/blob/
    2f88272ba298f20f5756415d2a69e6f6617fcbbe/lib/fs.js#L172-L204)
  */
  if (typeof options === 'function' || !options) {
    options = { encoding: null, flag: 'r' };
  } else if (typeof options === 'string') {
    options = { encoding: options, flag: 'r' };
  } else if (!options) {
    options = { encoding: null, flag: 'r' };
  } else if (typeof options !== 'object') {
    throw new TypeError('Bad arguments');
  }

  var encoding = options.encoding;

  var fd, _cb, read, ended

  var flag = options.flag || 'r';
  fs.open(path, flag, 438 /*=0666*/, function(er, fd_) {
    if (er) {
      ended = er
      if(_cb)
        _cb(ended)
    }
    fd = fd_;
    var buffer = new Buffer(blocksize)
    read = function (abort, cb) {
      fs.read(fd, buffer, 0, blocksize, -1, function (err, bytes, buffer) {
        if(err)         return cb(ended = err)
        if(bytes === 0) return cb(true)
        cb(null, buffer.slice(0, bytes))
      })
    }
    read(null, _cb)
  })

  return function (abort, cb) {
    if(!read) _cb = cb
    else read(abort, cb)
  }
})

function testStat(test) {
  return function () {
    return pull.asyncMap(function (e, cb) {
      fs.stat(e, function (err, stat) {
        if(stat && test(stat))
          cb(null, e)
        else
          cb(null, null)
      })
    }).pipe(pull.filter())
  }
}


var isFile = 
exports.isFile =
testStat(function (e) { return e.isFile() })

var isDirectory = 
exports.isDirectory =
testStat(function (e) { return e.isDirectory() })

var isBlockDevice = 
exports.isBlockDevice =
testStat(function (e) { return e.isBlockDevice() })

var isCharacterDevice = 
exports.isCharacterDevice =
testStat(function (e) { return e.isCharacterDevice() })

var isSymbolicLink = 
exports.isSymbolicLink =
testStat(function (e) { return e.isSymbolicLink() })

var isFIFO = 
exports.isFIFO =
testStat(function (e) { return e.isFIFO() })

var isSocket = 
exports.isSocket =
testStat(function (e) { return e.isSocket() })


