import bunyan from 'bunyan'

const level = process.env.AQUEDUX_LOG_LEVEL || 'info'

const logger = bunyan.createLogger({
  name: 'aquedux-tank',
  level
})

export default logger
