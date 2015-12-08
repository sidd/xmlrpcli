#!/usr/bin/env node
const readline = require('readline')
const XMLRPCClient = require('../')
const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'url',
    u: 'username',
    user: 'username',
    p: 'password',
    pass: 'password',
    i: 'insecure'
  },
  string: [
    'url'
  ],
  default: {
    url: 'https://localhost',
    path: '/',
    insecure: false
  },
  boolean: ['insecure']
})

if (process.argv.length === 2 || argv.help) {
  console.log(
`xmlrpcli v0.3.0
usage: xmlrpcli [-h host-url] [-u username] [-p password] [[--insecure]]
  -h, --url <host-url>
    Specify host URL with path to RPC endpoint.

  -u, --user, --username <username>
    Specify username for basic authentication.

  -p, --pass, --password <password>
    Specify password for basic authentication.

  -i, --insecure
    NOT RECOMMENDED: force HTTP (instead of HTTPS) connection.`)
  process.exit(0)
}

// Everything is good, initialize client
const Client = new XMLRPCClient(argv)

// Set up console
const rl = readline.createInterface(process.stdin, process.stdout)
rl.setPrompt('> ')
rl.prompt()

// Handle input submission
rl.on('line', line => {
  line = line.trim()
  if (!line) return rl.prompt()

  // Allow multiple spaces between params
  line = line.split(' ').filter(el => el)

  if (line[0].toLowerCase() === 'help') {
    return rtorrentHelp.apply(null, line.slice(1))
  }

  // Pass params if supplied, otherwise null
  Client.method(
    line[0],
    null,
    line.length > 1 ? line.slice(1) : null,
    (err, res) => {
      if (err) {
        console.error((err.res ? err.res.statusCode + ' ' : '') + 'Error: ' + err.message)
      } else {
        console.log(res)
      }

      rl.prompt()
    }
  )
})

function rtorrentHelp () {
  const args = [].slice.call(arguments)

  Client.method('system.listMethods', true, (err, methods) => {
    if (err) {
      console.error('Error: ' + err.message)
      return rl.prompt()
    }

    // if there's no args, just show the non-prefixed methods;
    // otherwise there's just too much to show.
    if (!args.length) {
      console.log(methods.filter(m => m.split('.').length === 1).join('\n'))

    // if `help prefix|prefixes` is run
    } else if (['prefix', 'prefixes'].indexOf(args[0]) !== -1) {
      const prefixes = methods.reduce(
        (res, m) => {
          m = m.split('.')

          if (m.length > 1) {
            res.add(m[0])
          }
          return res
        }, new Set()
      )
      console.log(Array.from(prefixes).join('\n'))

    // default filtering, only shows those that start with
    // "<name>."
    } else {
      console.log(methods.filter(m => m.split('.')[0] === args[0]).join('\n'))
    }
    rl.prompt()
  })

}
