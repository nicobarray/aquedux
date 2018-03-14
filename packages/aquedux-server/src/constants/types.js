// @flow

import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux'
import type { AqueduxActionType } from './actionTypes'

export type AqueduxConfiguration = {
  // The action count after which the redis queue must compact itself to 1 action.
  queueLimit?: number,
  // The action types that should be routed to redis.
  statefullTypes?: Array<string>,
  routePrefix?: string,
  secret?: string,
  redisHost?: string,
  redisPort?: string,
  onConnection?: any => void,
  onClose?: any => void,
  doFragmentSnapshot?: any => void
}

export type QueueInnerStateType =
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

// The type of a queue state
export type QueueState = {
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

export type Action = {
  type: string,
  [string]: ?any,
  tankId: string
}

export type SubscriptionAction = { type: string, tankId: string, id: ?string }

export type AqueduxAction =
  | { type: AqueduxActionType, name: string }
  | { type: AqueduxActionType, name: string, subId: string, cursor: number }
  | { type: AqueduxActionType, action: Action }

export type TankStateType = {
  id: string,
  channels: Array<string>
}

export type TanksStateType = {
  tanks: {
    [string]: TankStateType
  }
}

export type DefinitionStateType = {
  name: string,
  pattern: ?string,
  template: boolean
}

export type ChannelsStateType = {
  definitions: {
    [string]: DefinitionStateType
  }
}

// Aquedux redux store/dispatch/getState/thunk types.
export type AqueduxState = {
  id: string,
  removeQueueType: string,
  queues:
    | {
        [key: string]: QueueState
      }
    | {},
  tanks: TanksStateType,
  channels: ChannelsStateType
}
export type State = {
  aquedux: AqueduxState
}
export type ThunkedAction = (dispatch: Dispatch, getState: () => State) => void | ((dispatch: Dispatch) => void)
export type Store = ReduxStore<State, AqueduxAction>
export type Dispatch = ReduxDispatch<AqueduxAction> & ((action: ThunkedAction) => void)
