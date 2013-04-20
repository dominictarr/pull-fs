var pull = require('pull-stream')
var pfs  = require('../')

//count lines of js recursively!
pull.widthFirst(process.cwd(), pfs.readdir)
.pipe(pull.filter(/\.js$/))
.pipe(pull.filterNot(/test|example/))
.pipe(pfs.wc())
.pipe(pull.reduce(function (acc, item) {
  if(!acc) {
    delete item.file
    return item
  }
  acc.lines += item.lines
  acc.chars += item.chars
  acc.words += item.words
  return acc
}, null, function (err, data) {
  if(err) throw err
  console.log(data)
}))

