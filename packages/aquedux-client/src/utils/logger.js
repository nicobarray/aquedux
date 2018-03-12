import bunyan from 'bunyan'

const level = process.env.REACT_APP_AQUEDUX_BUNYAN_LEVEL || 'info'

const logger = bunyan.createLogger({
  name: 'aquedux-tank',
  level
})

export default logger
