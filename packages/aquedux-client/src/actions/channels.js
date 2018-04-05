import actionTypes from '../constants/actionTypes'

export const define = name => ({
  type: actionTypes.AQUEDUX_CLIENT_CHANNEL_DEFINE,
  name
})

export const join = (name, id) => ({
  type: actionTypes.AQUEDUX_CLIENT_CHANNEL_JOIN,
  name,
  id
})

export const leave = (name, id) => ({
  type: actionTypes.AQUEDUX_CLIENT_CHANNEL_LEAVE,
  name,
  id
})

export default {
  define,
  join,
  leave
}
