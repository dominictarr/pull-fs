var path = require('path')
var pull = require('pull-stream')
var split = require('pull-split')
var core  = require('./core')

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
    return core.readdir(dir)
  })
  .pipe(pull.flatten())
  .pipe(pull.filter(match))
}

var resolve = 
exports.resolve = 
function (rel) {
 return pull.map(function (dir) { //map to $dir/node_modules
    return path.resolve(dir, rel)
  })
}


