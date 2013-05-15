var path = require('path')
var pull = require('pull-stream')
var split = require('pull-split')
var core  = require('./core')
var fs    = require('fs')

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


var wc = 
exports.wc = 
function () {
  return pull.asyncMap(function (file, cb) {
    var data = {lines: 0, chars:0, words: 0, file: file}

    core.read(file)
    .pipe(split())
    .pipe(pull.reduce(function (total, line) {
      total.lines ++
      total.chars += line.length + 1 //+1 for new line
      //note, splitting, since it creates an array,
      //will not be the most optimal method.
      total.words +=
        line.split(/\s+/)
        .reduce(function (s, i) {
          return s + (i ? 1 : 0)
        }, 0)

      return total
    }, data, cb))
  })
}

var star =
exports.star = 
function (match) {
  return pull.map(function (dir) {
    return core.readdir(dir, match)
  })
  .pipe(pull.flatten())
  .pipe(pull.filter())
}

var starStar =
exports.starStar =
function (match) {
  var seen = {}
  return pull.map(function (dir) {
    var first = true
    return pull.depthFirst(path.resolve(dir), function (_dir) {
      return core.readdir(_dir, match)
      .pipe(pull.filter(function (e) {
        if(seen[e]) return false
        return seen[e] = true
      }))
    })

  })
  .pipe(pull.flatten())
  .pipe(pull.filter())
}

var resolve = 
exports.resolve = 
function (rel) {
 return pull.map(function (dir) { //map to $dir/node_modules
    if(rel)
      return path.resolve(dir, rel)
    return path.resolve(dir)
  })
}

var relative = 
exports.relative =
function (rel) {
  rel = rel || process.cwd()
  return pull.map(function (file) {
    return path.relative(rel, file)
  })
}

var absolute =
exports.absolute =
function () {
  return resolve()
}

var readFile =
exports.readFile = function (parse) {
  return pull.asyncMap(function (file, cb) {
    fs.readFile(file, 'utf-8', function (err, data) {
      if(err) return cb(err) 
      try {
         data = parse ? parse(data) : data
      } catch (err) {
        return cb(err)
      }
      return cb(null, data)
    })
  })
}

if(!module.parent) {
  pull.values(['.'])
  .pipe(starStar())
  .pipe(pull.drain(console.log))
}
