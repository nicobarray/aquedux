// @flow

import type { Action } from './constants/types'

const internalState = {
  map: action => ''
}

// This action is provided by the aquedux-server configuration - therefore user-defined.
export const mapActionToChannelId = (action: Action): string => internalState.map(action)

const setMapActionToChannelId = (map: Action => string): void => {
  internalState.map = map
}

export default {
  mapActionToChannelId,
  setMapActionToChannelId
}
