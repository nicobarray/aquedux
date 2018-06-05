// @flow

import { head } from 'lodash'
import Maybe from 'crocks'

const { Nothing } = Maybe

type QueueInnerStateType =
  // This is the queue state on the queue creation before it had time to start loading the redis content into memory.
  | 'QUEUE_STATE_CREATED'
  // This is the queue state when it loads from redis the actions list into memory
  | 'QUEUE_STATE_LOADING'
  // This is the queue state when the queue is writing or reading to/from the redis queue.
  | 'QUEUE_STATE_BUSY'
  // This is the queue state when it can receive a write or read operation
  | 'QUEUE_STATE_AVAILABLE'
  // This is the queue state when a user decided to remove it totally (from redis too)
  | 'QUEUE_STATE_PURGED'

type QueueState = {
  name: string,
  // The cursor maps the index of the latest action fetched from the redis queue.
  cursor: number,
  // This notification queues the incoming redis keyspace notifiction and is pop'd sequentially
  // to handle action fetching/dispatching. That way, there is no asynchronous mistakes such as race conditions
  // that can happen.
  notificationQueue: Array<number>,
  // This push queue is used to order multiple action received that needs to be put into redis.
  pushQueue: Array<Object>,
  // The queue state is used to regular action flow in the queue
  // (when it can push to redis, when it is busy reading, etc, etc)
  innerState: QueueInnerStateType,
  // The redis connexion id that handles all subscriptions/notification from redis.
  // Use the id to get the connexion object from ./connection.js (the 'get' method)
  subId: ?string
}

type State = {
  [string]: QueueState
}

const state: State = {}

// Actions

function loadQueue(
  name: string = '',
  cursor: number = 0,
  notificationQueue: Array<number> = [],
  pushQueue: Array<Object> = [],
  innerState: QueueInnerStateType = 'QUEUE_STATE_CREATED',
  subId?: string
) {
  state[name] = {
    name,
    cursor,
    notificationQueue,
    pushQueue,
    innerState,
    subId
  }
}

function unloadQueue(name: string) {
  delete state[name]
}

function enqueueNotification(name: string) {
  state[name].notificationQueue.push(state[name].cursor)
  state[name].cursor++
}

function dequeueNotification(name: string) {
  state[name].notificationQueue.shift()
}

function enqueueAction(name: string, action: Object) {
  state[name].pushQueue.push(action)
}

function dequeueAction(name: string) {
  state[name].pushQueue.shift()
}

function lockQueue(name: string) {
  state[name].innerState = 'QUEUE_STATE_BUSY'
}

function unlockQueue(name: string) {
  state[name].innerState = 'QUEUE_STATE_AVAILABLE'
}

function setCursor(name: string, cursor: number) {
  state[name].cursor = cursor
}

// Selectors

function safeQueue(name: string): Maybe {
  return state.hasOwnProperty(name) ? Maybe.Just(state[name]) : Maybe.Nothing()
}

function listQueues(): Array<QueueState> {
  return Object.keys(state).map(key => state[key])
}

function hasNoQueue(name: string): boolean {
  return safeQueue(name).equals(Nothing())
}

function getNextNotification(name: string): Maybe<number> {
  return safeQueue(name).map(queue => queue.notificationQueue)
}

function getNextAction(name: string): Maybe<Object> {
  return safeQueue(name)
    .map(queue => queue.pushQueue)
    .map(head)
}

function getCursor(name: string): Maybe<number> {
  return safeQueue(name).map(queue => queue.cursor)
}

/**
 * An non-existing queue is an empty push queue.
 * @param name Queue name
 */
function isPushQueueEmpty(name: string): boolean {
  return safeQueue(name)
    .map(queue => queue.pushQueue.length === 0)
    .option(true)
}

/**
 * An non-existing queue is an available queue.
 * @param name Queue name
 */
function isQueueBusy(name: string): boolean {
  return safeQueue(name)
    .map(queue => queue.innerState === 'QUEUE_STATE_BUSY')
    .option(false)
}

/**
 * An non-existing queue is an available queue.
 * The queue is ready here if it is created and loaded.
 * @param name Queue name
 */
function isQueueReady(name: string): boolean {
  return safeQueue(name)
    .map(queue => queue.innerState === 'QUEUE_STATE_AVAILABLE' || queue.innerState === 'QUEUE_STATE_BUSY')
    .option(false)
}

export default {
  loadQueue,
  unloadQueue,
  enqueueNotification,
  dequeueNotification,
  enqueueAction,
  dequeueAction,
  lockQueue,
  unlockQueue,
  setCursor,
  listQueues,
  hasNoQueue,
  getNextNotification,
  getNextAction,
  getCursor,
  isPushQueueEmpty,
  isQueueBusy,
  isQueueReady
}
