var pull = require('pull-stream')
var pfs  = require('../')
var path = require('path')

pull.depthFirst(process.cwd(), function (dir) {
  return pfs.readdir(path.resolve(dir, './node_modules'))
          .pipe(pull.filter())
})
.pipe(pull.map(function (e) {
  return path.relative(process.cwd(), e)
}))
.pipe(pull.drain(console.log))

