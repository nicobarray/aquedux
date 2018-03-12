// @flow

import { combineReducers } from 'redux'
import queues, { selectors as queuesSelectors } from './queues'
import { selectors as tankSelectors } from './tank'
import { selectors as channelsSelectors } from './channels'

import type { State, AqueduxState } from '../constants/types'

const reducer: State = queues

export default reducer

const forwardAqueduxStateAndName = (func: any) => (state: State, name: string) => func(state.aquedux, name)
const forwardAqueduxState = (func: any) => (state: State) => func(state.aquedux)

export const selectors = {
  queue: {
    listQueues: (state: State) => queuesSelectors.listQueues(state.aquedux),
    getName: forwardAqueduxStateAndName(queuesSelectors.getName),
    getCursor: forwardAqueduxStateAndName(queuesSelectors.getCursor),
    getNotificationQueue: forwardAqueduxStateAndName(queuesSelectors.getNotificationQueue),
    getPushQueue: forwardAqueduxStateAndName(queuesSelectors.getPushQueue),
    getInnerState: forwardAqueduxStateAndName(queuesSelectors.getInnerState),
    getSubId: forwardAqueduxStateAndName(queuesSelectors.getSubId),
    getNextNotification: forwardAqueduxStateAndName(queuesSelectors.getNextNotification),
    getNextAction: forwardAqueduxStateAndName(queuesSelectors.getNextAction),
    isPushQueueEmpty: forwardAqueduxStateAndName(queuesSelectors.isPushQueueEmpty),
    isQueueBusy: forwardAqueduxStateAndName(queuesSelectors.isQueueBusy),
    isReady: forwardAqueduxStateAndName(queuesSelectors.isReady),
    hasQueue: forwardAqueduxStateAndName(queuesSelectors.hasQueue),
    isReady: forwardAqueduxStateAndName(queuesSelectors.isReady),
    isRemoveQueueType: forwardAqueduxStateAndName(queuesSelectors.isRemoveQueueType),
    getId: forwardAqueduxState(queuesSelectors.getId),
    getQueueLimit: forwardAqueduxState(queuesSelectors.getQueueLimit),
    isStatefull: forwardAqueduxStateAndName(queuesSelectors.isStatefull)
  },
  tank: {
    getChannels: (tankId: string, state: State) => tankSelectors.getTankChannels(tankId, state.aquedux.tanks),
    listOthers: (tankId: string, state: State) => tankSelectors.listOthers(tankId, state.aquedux.tanks),
    listAll: (state: State) => tankSelectors.listAll(state.aquedux.tanks)
  },
  channels: {
    listChannelName: (state: State) => channelsSelectors.listChannelNames(state.aquedux.channels),
    listAll: (state: State) => channelsSelectors.listAll(state.aquedux.channels),
    listChannels: (state: State) => channelsSelectors.listChannels(state.aquedux.channels),
    listTemplates: (state: State) => channelsSelectors.listTemplates(state.aquedux.channels),
    isTemplate: (channelName: string, state: State) =>
      channelsSelectors.isTemplate(channelName, state.aquedux.channels),
    getPattern: (channelName: string, state: State) => channelsSelectors.getPattern(channelName, state.aquedux.channels)
  }
}
