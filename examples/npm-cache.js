
var pull = require('pull-stream')
var pfs  = require('../')
var path = require('path')

pull.values([path.join(process.env.HOME, '.npm')])
.pipe(pfs.star())
.pipe(pfs.star())
.pipe(pfs.isDirectory()) //get all the cached modules
.pipe(pull.drain(console.log))
