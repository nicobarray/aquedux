import bunyan from 'bunyan'

const logger = bunyan.createLogger({ name: 'aquedux-server' })

logger.fatalExit = (errorCode, ...args) => {
  logger.fatal(...args)
  process.exit(errorCode)
}

logger.debug({ who: 'aquedux-server', what: 'logger configuration', src: logger.src, level: logger.level })

export default logger
