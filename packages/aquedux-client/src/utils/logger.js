import bunyan from 'bunyan'

const logger = bunyan.createLogger({
  name: 'aquedux-tank'
})

export default logger
