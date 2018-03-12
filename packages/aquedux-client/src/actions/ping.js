import actionTypes from '../constants/actionTypes'

const send = () => ({
  type: actionTypes.AQUEDUX_PING,
  timestamp: Date.now()
})

const note = () => ({
  type: actionTypes.AQUEDUX_PING_SENT,
  timestamp: Date.now()
})

const restart = () => ({
  type: actionTypes.AQUEDUX_PING_RESTART,
  timestamp: Date.now()
})

const ko = () => ({
  type: actionTypes.AQUEDUX_PING_KO,
  timestamp: Date.now()
})

export default {
  send,
  note,
  restart,
  ko
}
