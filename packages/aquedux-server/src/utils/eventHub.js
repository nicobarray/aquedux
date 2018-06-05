export const events = {
  EVENT_SEND_ACTION_TO_TANK: '@aquedux-event/send-action-to-tank',
  EVENT_SEND_CHANNEL_SNAPSHOT_TO_TANK: '@aquedux-event/send-channel-snapshot-to-tank',
  EVENT_ACTION_RECEIVED: '@aquedux-event/action-received'
}

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
