
var fs = require('fs')
var pfs = require('../')
var pull = require('pull-stream')

var file = __dirname + '/../core.js'
var text = fs.readFileSync(file, 'utf-8')

var test = require('tape')

test('read a file', function (t) {
  pfs.read(file, 'utf-8')
    .pipe(pull.through(console.log))
    .pipe(pull.collect(function (err, ary) {
      t.equal(ary.join(''), text)
      t.end()
    }))
})

test('write a file', function (t) {
  var lines = ['a\n', 'b\n', 'c\n']
  var file = '/tmp/test-pfs-write'
  pull.values(lines)
    .pipe(pfs.write(file, function (err) {
      if(err) throw err
      fs.readFile(file, 'utf-8', function () {
        t.equal(file, lines.join(''))
        t.end()
      })
    }))
})
