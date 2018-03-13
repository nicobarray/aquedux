// @flow

import actionTypes from '../constants/actionTypes'

const define = (channelName: string, channelPattern: string) => {
  return {
    type: actionTypes.channel.AQUEDUX_CHANNEL_DEFINE,
    channelName,
    channelPattern
  }
}

const defineTemplate = (channelName: string) => {
  return {
    type: actionTypes.channel.AQUEDUX_CHANNEL_DEFINE_TEMPLATE,
    channelName
  }
}

const snapshot = (channelOrTemplateName: string, id: string, snapshot: Object) => ({
  type: actionTypes.channel.AQUEDUX_CHANNEL_SNAPSHOT,
  timestamp: Date.now(),
  channelOrTemplateName,
  id,
  snapshot
})

export default {
  define,
  defineTemplate,
  snapshot
}
