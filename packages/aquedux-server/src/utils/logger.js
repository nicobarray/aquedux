import bunyan from 'bunyan'

const level = process.env.AQUEDUX_LOG_LEVEL || 'info'
const src = ['trace', 'debug'].indexOf(level) !== -1
const logger = bunyan.createLogger({ name: 'aquedux-server', level, src })
logger.debug({ who: 'aquedux-server', what: 'logger configuration', src: logger.src, level: logger.level })
export default logger
