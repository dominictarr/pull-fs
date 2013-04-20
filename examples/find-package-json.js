var pfs = require('../')
var pull = require('pull-stream')

pfs.ancestors() //ancestors of cwd
.pipe(pfs.resolve('./package.json'))
.pipe(pfs.isFile())
.pipe(pull.find(function (err, file) {
  if(err) throw err
  console.log(file)
}))

