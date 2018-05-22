export const events = {
  EVENT_ACTION_SEND: '@aquedux-event/action-send',
  EVENT_ACTION_RECEIVE: '@aquedux-event/action-receive',
  EVENT_CHANNEL_RESUBSCRIBE: '@aquedux-event/channel-resubscribe',
  EVENT_CLIENT_START: '@aquedux-event/client-start',
  EVENT_CLIENT_STOP: '@aquedux-event/client-stop',
  EVENT_CLIENT_RESTART: '@aquedux-event/client-restart'
}

// import localStorage from '../utils/localStorage'

let eventMap = {}

export const register = (channel, callback) => {
  if (!eventMap[channel]) {
    eventMap[channel] = []
  }
  eventMap[channel].push(callback)
}

export const unregister = (channel, callback) => {
  if (eventMap[channel]) {
    eventMap[channel] = eventMap[channel].filter(c => c !== callback)
  }
}

export const raise = (channel, args) => {
  if (eventMap[channel]) {
    if (localStorage.getItem('aquedux-debug-eventhub')) {
      console.log(`[debug] Event on ${channel} -> ${eventMap[channel].length} obs`)
    }
    eventMap[channel].forEach(callback => callback(args))
  }
}
