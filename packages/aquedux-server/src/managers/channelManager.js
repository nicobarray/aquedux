// @flow

// Types.
import type { Store, State, Action, SubscriptionAction, DefinitionStateType } from '../constants/types'

import { selectors } from '../reducers'
import actions from '../actions'
import { subActionToChannelName, subActionToTemplateName } from '../network/subscribe'

type Channel = {
  name: string,
  predicate: Action => boolean,
  reducer: (State, Action) => Object
}

type Template = {
  name: string,
  createPredicate: string => Action => boolean,
  reducer: (State, Action) => Object
}

type InternalState = {
  channels: {
    [string]: Channel
  },
  templates: {
    [string]: Template
  }
}

const internalState: InternalState = {
  channels: {},
  templates: {}
}

const findChannelForAction = (state: State, action: Action): Channel => {
  const channel = selectors.channels
    .listChannels(state)
    .map(channel => internalState.channels[channel.name])
    .find(channel => channel.predicate(action))

  if (!channel) {
    throw new Error(
      `findChannelForAction -- Action ${
        action.type
      } does not match any channel. Did you call addChannel or addChannelTemplate?`
    )
  }

  return channel
}

const findChannelNameForAction = (state: State, action: Action): string =>
  getChannelHandlersFromAction(state, action).name

const getChannelHandlersFromName = (channelName: string): Channel => {
  if (!channelName || !internalState.channels.hasOwnProperty(channelName)) {
    throw new Error(`${channelName} do not match any channel. Did you call addChannelHandlers?`)
  }
  return internalState.channels[channelName]
}

const getTemplateFromName = (templateName: string): Template => {
  if (!templateName || !internalState.templates.hasOwnProperty(templateName)) {
    throw new Error(`${templateName} do not match any template. Did you call addTemplateHandlers?`)
  }
  return internalState.templates[templateName]
}

const addChannelHandlers = (
  channelName: string,
  predicate: Action => boolean,
  reducer: (State, Action) => Object
): void => {
  if (internalState.channels.hasOwnProperty(channelName) || internalState.templates.hasOwnProperty(channelName)) {
    throw new Error(`The channel ${channelName} is already defined. A channel is unique.`)
  }

  internalState.channels[channelName] = {
    name: channelName,
    predicate,
    reducer
  }
}

const addTemplateHandlers = (
  channelName: string,
  createPredicate: string => Action => boolean,
  reducer: (State, Action) => Object
): void => {
  if (internalState.channels.hasOwnProperty(channelName) || internalState.templates.hasOwnProperty(channelName)) {
    throw new Error(`The channel ${channelName} is already defined. A channel is unique.`)
  }

  internalState.templates[channelName] = {
    name: channelName,
    createPredicate,
    reducer
  }
}

const getChannelHandlersFromAction = (state: State, action: Action): Channel => {
  const channel = selectors.channels
    .listChannels(state)
    .map(channel => internalState.channels[channel.name])
    .find(channel => channel.predicate(action))

  if (!channel) {
    throw new Error(
      `getChannelHandlersFromAction -- Action ${
        action.type
      } does not match any channel. Did you call addChannel or addChannelTemplate?`
    )
  }

  return channel
}

const createChannelFromTemplate = (store: Store, subAction: SubscriptionAction): Channel => {
  const channelName = subActionToChannelName(subAction)

  // If the template is already instantiated.
  if (internalState.channels.hasOwnProperty(channelName)) {
    return internalState.channels[channelName]
  }

  // Else create the channel from template.
  const templateName = subActionToTemplateName(subAction)
  const template = getTemplateFromName(templateName)

  // $FlowFixMe: subAction has id field (checked by subActionToChannelName)
  const id = (subAction.id: string)

  addChannelHandlers(channelName, template.createPredicate(id), template.reducer)
  store.dispatch(actions.channel.define(channelName, channelName))

  return getChannelHandlersFromName(channelName)
}

const checkChannelExists = (channelName: string): boolean =>
  !!channelName && internalState.channels.hasOwnProperty(channelName)

export default {
  addChannelHandlers,
  addTemplateHandlers,
  getChannelHandlersFromAction,
  getChannelHandlersFromName,
  findChannelNameForAction,
  createChannelFromTemplate,
  checkChannelExists
}
