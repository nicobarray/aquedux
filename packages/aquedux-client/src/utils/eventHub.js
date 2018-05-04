export const EVENT_SEND = 'AQUA:SEND'

let eventMap = {}

export const register = (channel, callback) => {
  if (!eventMap[channel]) {
    eventMap[channel] = []
  }
  eventMap[channel] = [...eventMap[channel], callback]
}

export const unregister = (channel, callback) => {
  if (eventMap[channel]) {
    eventMap[channel] = eventMap[channel].filter(c => c !== callback)
  }
}

export const raise = (channel, args) => {
  if (eventMap[channel]) {
    eventMap[channel].forEach(callback => callback(args))
  }
}
