
var pull = require('pull-stream')
var fs   = require('fs')
var path = require('path')

var ancestors = 
exports.ancestors = 
function (dir) {
  dir = dir || process.cwd()
  var paths = []

  while(dir) {
    paths.push(dir)
    dir = path.dirname(dir)
    if(dir === '/') {
      paths.push(dir) 
      break
    }
  }

  return pull.values(paths)
}

var readdir =
exports.readdir =
pull.Source(function (dir) {
  var ls, ended = false
  return function (abort, cb) {
    if(abort || ended) {
      cb(ended = ended || ended)
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

//move this to another module!

var flattenStreams = 
exports.flattenStreams =
pull.Through(function (read) {
  var _read
  return function (abort, cb) {
    if(_read) nextChunk()
    else      nextStream()

    function nextChunk () {
      _read(null, function (end, data) {
        if(end) nextStream()
        else    cb(null, data)
      })
    }
    function nextStream () {
      read(null, function (end, stream) {
        if(end)
          return cb(end)
        if('function' != typeof stream) {
          throw new Error('expected stream of streams')
        }
        _read = stream
        nextChunk()
      })
    }
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
  console.log(path, flag, options)
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


var star =
exports.star = 
function (match) {
  return pull.map(function (dir) {
      return readdir(dir)
    })
    .pipe(flattenStreams())
    .pipe(pull.filter(match))
}

var resolve = 
exports.resolve = 
function (rel) {
 return pull.map(function (dir) { //map to $dir/node_modules
    return path.resolve(dir, rel)
  })
}

var decendents =
exports.decendants =
function (dir) {
  return pull.widthFirst(dir, readdir)
}

var isFile = 
exports.isFile =
function (read) {
  return pull.asyncMap(function (e, cb) {
    fs.stat(e, function (err, stat) {
      if(stat && stat.isFile())
        cb(null, e)
      else
        cb(null, null)
    })
  })//.pipe(pull.filter())
}
//ancestors().rel('./node_modules/').ls().ls(/\.js$/).wc()

if(!module.parent) {
  /*
  ancestors()
  .pipe(resolve('./package.json'))
  .pipe(isFile())
  .pipe(pull.find(console.log))
  */
  /*
  pull.widthFirst(process.cwd, function (dir) {
    return readdir(path.resolve(dir, './node_modules'))
  })
  .pipe(pull.through(console.log))
  .pipe(pull.drain())
  */

  /*
  pull.widthFirst(process.cwd(), readdir)
  .pipe(pull.filter(/\.js$/))
  .pipe(pull.filterNot(/test/))
  .pipe(pull.through(console.log))
  .pipe(pull.drain())
  */
  console.log('read)')
  read(__filename).pipe(function (read) {
    console.log('read')
    read(null, function next (err, data) {
      if(err === true) return
      if(err) throw err
      if(false === process.stdout.write(data)) {
        process.stdout.once('drain', function () {
          read(null, next)
        })
      } else {
        read(null, next)
      }
    })
  })
}

//LASTLINE
