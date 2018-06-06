// @flow

import Maybe from 'crocks'

import type { SubscriptionAction } from '../constants/types'
import { subActionToChannelName, subActionToTemplateName } from '../channels'
import configManager from './configManager'

type Action = {
  type: string
}

type Channel = {
  name: string,
  predicate: Action => boolean,
  reducer: (() => Object, Action) => Object,
  matchPattern: string
}

type Template = {
  name: string,
  createPredicate: string => Action => boolean,
  reducer: (() => Object, Action) => Object
}

type State = {
  channels: {
    [string]: Channel
  },
  templates: {
    [string]: Template
  }
}

const state: State = {
  channels: {},
  templates: {}
}

// Helpers

const { Just, Nothing } = Maybe

function safeChannel(name: string): Maybe {
  return state.channels.hasOwnProperty(name) ? Just(state.channels[name]) : Nothing()
}

function safeTemplate(name: string): Maybe {
  return state.templates.hasOwnProperty(name) ? Just(state.templates[name]) : Nothing()
}

// Api

function defineChannel(
  channelName: string,
  predicate: Action => boolean,
  reducer: (() => Object, Action) => Object,
  matchPattern: string
): void {
  if (!safeChannel(channelName).equals(Nothing())) {
    return
  }

  if (!safeTemplate(channelName).equals(Nothing())) {
    return
  }

  state.channels[channelName] = {
    name: channelName,
    predicate,
    reducer,
    matchPattern
  }
}

function addDefaultChannel(name: string): void {
  defineChannel(
    name,
    action => configManager.getConfig().hydratedActionTypes.indexOf(action.type) !== -1,
    (getState, _action) => {
      return getState()[name]
    },
    name
  )
}

function addChannel(channel: Channel): void {
  defineChannel(channel.name, channel.predicate, channel.reducer, channel.matchPattern)
}

function all(array, fn) {
  return array.reduce((check, value) => check && fn(value), true)
}

function isValidChannel(channel: Channel): boolean {
  return all(['name', 'predicate', 'reducer'], channel.hasOwnProperty)
}

function defineTemplate(
  channelName: string,
  createPredicate: string => Action => boolean,
  reducer: (Object, Action) => Object
): void {
  if (!safeChannel(channelName).equals(Nothing())) {
    return
  }

  if (!safeTemplate(channelName).equals(Nothing())) {
    return
  }

  state.templates[channelName] = {
    name: channelName,
    createPredicate,
    reducer
  }
}

function addTemplate(template: Template): void {
  defineTemplate(template.name, template.createPredicate, template.reducer)
}

function isValidTemplate(template: Template): boolean {
  return all(['name', 'createPredicate', 'reducer'], template.hasOwnProperty)
}

function createChannelFromTemplate(subAction: SubscriptionAction): Channel {
  const channelName = subActionToChannelName(subAction)

  // If the template is already instantiated.)
  if (state.channels.hasOwnProperty(channelName)) {
    return state.channels[channelName]
  }

  // Else create the channel from template.
  const templateName = subActionToTemplateName(subAction)
  safeTemplate(templateName).map(template => {
    defineChannel(channelName, template.createPredicate(subAction.id), template.reducer, channelName)
  })

  return getChannelHandlersFromName(channelName)
}

// Selectors

function getChannelHandlersFromAction(action: Action): Channel {
  const channel = Object.keys(state.channels)
    .map(channelName => state.channels[channelName])
    .find(channel => channel.predicate(action))

  if (!channel) {
    // TODO: change this error to a publicly understandable error. Reference the createAquedux option arg.
    throw new Error(
      `getChannelHandlersFromAction -- Action ${
        action.type
      } does not match any channel. Did you call defineChannel or defineTemplate ?`
    )
  }

  return channel
}

function getChannelHandlersFromName(channelName: string): Channel {
  if (!channelName || !state.channels.hasOwnProperty(channelName)) {
    throw new Error(`${channelName} do not match any channel. Did you call defineChannel?`)
  }
  return state.channels[channelName]
}

function findChannelNameForAction(action: Action): string {
  return getChannelHandlersFromAction(action).name
}

function hasChannel(channelName: string): boolean {
  return state.channels.hasOwnProperty(channelName)
}

function listChannelName() {
  return Object.keys(state.channels)
}

function listChannels() {
  return listChannelName().map(name => state.channels[name])
}

function listTemplates() {
  return Object.keys(state.templates).map(name => state.templates[name])
}

function isTemplate(name: string): boolean {
  return state.templates.hasOwnProperty(name)
}

export default {
  addChannel,
  addDefaultChannel,
  isValidChannel,

  addTemplate,
  isValidTemplate,

  createChannelFromTemplate,

  getChannelHandlersFromAction,
  getChannelHandlersFromName,
  findChannelNameForAction,
  hasChannel,

  listChannelName,
  listChannels,
  listTemplates,
  isTemplate
}
