module.exports = XMLRPCClient
const debug = require('debug')('xmlrpcli:client')
const url = require('url')
const xmlrpc = require('xmlrpc')
const util = require('util')

function XMLRPCClient (opts) {
  var opt = {}

  if (!opts.url) {
    throw new Error('`opts.url` is a required parameter.')
  }
  if (opts.url.substring(0, 4) !== 'http') {
    opts.url = (opts.insecure ? 'http://' : 'https://') + opts.url
  }

  const parsedUrl = url.parse(opts.url)

  opt.host = parsedUrl.hostname
  opt.port = parsedUrl.port
  opt.path = parsedUrl.path || '/'

  if (opts.username || opts.password) {
    opt.basic_auth = {}
    opt.basic_auth.user = opts.username
    opt.basic_auth.pass = opts.password
  }

  opt.rejectUnauthorized = opts.insecure

  debug('Creating object with params: \n%o', opt)

  this.client = xmlrpc[opt.rejectUnauthorized ? 'createClient' : 'createSecureClient'](opt)

  this.methodCache = {}
}

XMLRPCClient.prototype.method = function (method, shouldUseCache, params, cb) {
  if (typeof method !== 'string') throw new Error('`method` must be a string.')
  if (typeof shouldUseCache === 'function') {
    cb = shouldUseCache
    shouldUseCache = null
  }
  if (typeof params === 'function') {
    cb = params
    params = null
  }
  if (typeof this.methodCache[method] === 'undefined') {
    this.client.methodCall(method, params, (err, res) => {
      if (!err && shouldUseCache) {
        this.methodCache[method] = res
      }
      cb(err, res)
    })
  } else {
    cb(null, this.methodCache[method])
  }
}

