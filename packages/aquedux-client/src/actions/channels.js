import actionTypes from '../constants/actionTypes'

export const define = name => ({
  type: actionTypes.AQUEDUX_CLIENT_DEFINE_CHANNEL,
  name
})

export const join = (name, id) => ({
  type: actionTypes.AQUEDUX_CLIENT_JOIN_CHANNEL,
  name,
  id
})

export const leave = (name, id) => ({
  type: actionTypes.AQUEDUX_CLIENT_LEAVE_CHANNEL,
  name,
  id
})

export default {
  define,
  join,
  leave
}
