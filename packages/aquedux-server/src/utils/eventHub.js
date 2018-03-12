// FIXME: Should be deprecated in favor for EventEmitter or Redux

export let eventMap = {}

export const register = (channel, callback) => {
  if (!eventMap[channel]) {
    eventMap[channel] = []
  }
  eventMap[channel] = [...eventMap[channel], callback]
}

export const unregister = (channel, callback) => {
  if (eventMap[channel]) {
    eventMap[channel] = eventMap[channel].filter(c => c !== callback)
    if (eventMap[channel].length === 0) delete eventMap[channel]
  }
}

export const raise = (channel, args) => {
  if (eventMap[channel]) {
    eventMap[channel].forEach(callback => {
      callback(args)
    })
  }
}

export const clear = () => {
  eventMap = {}
}
