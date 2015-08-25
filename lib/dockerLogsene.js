var loghose = require('docker-loghose')
var through = require('through2')
var Logsene = require('logsene-js')
var SpmAgent = require('spm-agent')
var Logagent = require('logagent-js')
var fs = require('fs')

function createLogAgent () {
  var patternFile = '/etc/logagent/patterns.yml'
  if (fs.existsSync(patternFile)) {
    return new Logagent(patternFile)
  } else {
    console.log('No pattern file for log parsing found ' + patternFile + ' -> using default patterns')
    console.log('Use -v /mypattern/patterns.yml:' + patternFile + ' for custom log parser definitions.')
    return new Logagent() // use default patterns
  }
}
function extend (origin, add) {
  // Don't do anything if add isn't an object
  if (!add || typeof add !== 'object') return origin
  var keys = Object.keys(add)
  var i = keys.length
  while (i--) {
    origin[keys[i]] = add[keys[i]]
  }
  return origin
}

function DockerLogsene () {
  this.imageNameRegEx = /sematext\/spm-agent-docker/
  this.logagent = createLogAgent()
  this.logger = new Logsene(process.env.LOGSENE_TOKEN, 'docker')
  this.logger.on('error', function (err) {
    SpmAgent.Logger.log('error', 'Error in logsene-js: ' + err, err)
  })
  var self = this
  this.logger.on('log', function (req) {
    self.debugLog(req.url)
    self.debugLog(req.request)
  })
  this.opts = {
    json: false,
    docker: null,
    events: null,
    // the following options limit the containers being matched
    // so we can avoid catching logs for unwanted containers
    matchByName: process.env.MATCH_BY_NAME,
    matchByImage: process.env.MATCH_BY_IMAGE,
    skipByName: process.env.SKIP_BY_NAME,
    skipByImage: process.env.SKIP_BY_IMAGE
  }
  var self = this
  setTimeout(function () {
    self.connect()
  }, 200)
}

DockerLogsene.prototype.debugLog = function (message)
{
  if (process.env.DEBUG_SPM_LOGGING === 'enabled') {
    SpmAgent.Logger.log('debug', message)
  }
}
DockerLogsene.prototype.getLogObject = function (line, container, cbf) {
  if (process.env.DEBUG_SPM_LOGGING==='enabled' && this.imageNameRegEx.test(container))
  {
    cbf('Disabled logging for image sematext/spm-agent-docker to avoid endless logging loop', null)
    return
  }
  var lines = line.split('\n')
  this.debugLog('Logs from Docker API (' + lines.length + ' lines) ' + container)
  this.debugLog('Logs from Docker API (content) for : ' + container + '\n' + lines)
  var self = this
  for (var i = 0; i < lines.length; i++) {
    this.logagent.parseLine(line, container, function (err, parsed) {
      self.debugLog('Log parser result: ' + JSON.stringify(parsed))
      return cbf(err, parsed)
    })
  }
}

DockerLogsene.prototype.connect = function () {
  var self = this
  var options = self.opts
  SpmAgent.Logger.log('debug', 'connect logStream to docker.sock')
  self.logStream = through.obj(function (chunk, enc, cb) {
    try {
      if (!chunk.line) {
        cb()
        return
      }
      var lines = chunk.line.split('\n') // We can get multiple lines per chunk
      lines.forEach(function (line) {
        self.logLine(line, chunk)
      })
      cb()
    } catch (ex) {
      console.log(ex)
      cb()
    }
  })
  // self.logStream.once('error', this.reconnect)
  var lh = loghose(options)
  lh.pipe(self.logStream)
  lh.on('error', this.reconnect)
}

DockerLogsene.prototype.logLine = function (logline, data, next) {
  var self = this
  var lineParser = {
    chunk: data,
    line: (process.env.REMOVE_ANSI_ESCAPE_SEQ === 'enabled') ? logline.replace(
            /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
            '') : logline,
    parse: function () {
      var chunk = this.chunk
      self.getLogObject(
      this.line,
      chunk.image + '_' + chunk.name + '_' + chunk.id,
      function (err, logObject) {
        if (err && !logObject) {
          return
        }
        if (logObject) {
          logObject.container_id = chunk.id
          logObject.image_name = chunk.image
          logObject.container_name = chunk.name
          logObject['@source'] = chunk.id + '/' + chunk.image
          var level = 'info'
          if (/error|fail|exception/i.test(this.line || '')) {
            level = 'error'
          }
          self.logger.log(String((logObject.level || logObject.lvl || logObject.severity || level)), 
            logObject.message || logObject.msg, logObject,
            function (err, msg) {
            if (err)
            {
              self.debugLog('Error to sending log:' + err)
            }
            if (msg) {
              self.debugLog('Stored Log: ' + JSON.stringify(msg))
            }
          })
        }
      })
    }
  }
  lineParser.parse()
}

DockerLogsene.prototype.reconnect = function (err) {
  var self = this
  SpmAgent.Logger.log('error', 'Error in log stream: ' + err)
  try {
    self.logStream = null
    self.connect()
    SpmAgent.Logger.log('debug', 'reconnect to docker.sock ')
  } catch (ex) {
    SpmAgent.Logger.log('error', ex)
    setTimeout(function () {
      self.reconnect()
      SpmAgent.Logger.log('debug', 'reconnect to docker.sock ')
    }, 1000)
  }
}

module.exports = new DockerLogsene()
