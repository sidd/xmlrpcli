module.exports = XMLRPCClient
const xmlrpc = require('xmlrpc')

function XMLRPCClient (opts) {
  var opt = {}

  opt.host = opts.host || 'localhost'
  opt.path = opts.path || '/'

  if (opts.username || opts.password) {
    opt.basic_auth = {}
    opt.basic_auth.user = opts.username
    opt.basic_auth.pass = opts.password
  }
  
  opt.rejectUnauthorized = opt.insecure

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

