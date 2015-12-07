#!/usr/bin/env node
var readline = require('readline')
var xmlrpc = require('xmlrpc')
var argv = require('minimist')(process.argv.slice(2))
var rl = readline.createInterface(process.stdin, process.stdout)

if (!(argv.host || argv.h) || argv.help) {
  console.error('usage: xmlrpcli [-h host] [--path path] [-u username] [-p password] [[--insecure]]')
  process.exit(1)
}

var host = argv.host || argv.h
var user = argv.user || argv.u
var pass = argv.password || argv.p
var path = argv.path || '/'

var client = xmlrpc[argv.insecure ? 'createClient' : 'createSecureClient']({
  host: host,
  basic_auth: {
    user: user,
    pass: pass
  },
  path: path,
  rejectUnauthorized: !(user || pass)
})

rl.setPrompt('> ')
rl.prompt()

rl.on('line', line => { 
  line = line.trim()
  if (!line) return rl.prompt()

  // Allow multiple spaces between params
  line = line.split(' ').filter(el => el) 

  if (line[0].toLowerCase() === 'help') {
    return help.apply(null, line.slice(1))
  }

  // Pass params if supplied, otherwise null
  client.methodCall(
    line[0],
    line.length > 1 ? line.slice(1) : null,
    (err, res) => {
      if (err) {
        console.error(err.res.statusCode + ' Error: ' +  err.message)
      } else {
        console.log(res)
      }

      rl.prompt()
    }
  )
})

function help () {
  var args = [].slice.call(arguments)
  
  client.methodCall('system.listMethods', null, (err, methods) => {
    if (err) {
      console.error('Error: ' +  err.message)
    } else {
      // if there's no args, just show the non-prefixed methods;
      // otherwise there's just too much to show.
      if (!args.length) {
        console.log(methods.filter(m => m.split('.').length === 1).join('\n'))
      // if an arg is specified (i.e. help view),
      // then its methods are listed
      } else {
        // `help prefix` shows all of the possible prefixes,
        // a prefix is: <prefix>.command, i.e. view.filter
        if (['prefix', 'prefixes'].indexOf(args[0]) !== -1) {
          console.log(methods.reduce(
            (res, m) => {
              m = m.split('.')

              if (m.length > 1) {
                res.add(m[0])
              }
              return res
            }, new Set()
          ))

        } else {
          // carry on
          console.log(methods.filter(m => m.split('.')[0] === args[0]).join('\n'))
        }
      }
    }
    rl.prompt()
  })
}
