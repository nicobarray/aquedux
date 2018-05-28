// @flow

/**
 * Compose a channel name.
 *
 * e.g if the channel name has no id, it returns the name argument.
 * else if the channel name has an id, it returns the name-id
 */
export function channelName(name: string, id?: string): string {
  return !!id ? `${name}-${id}` : name
}

export function channelNameFromAction(action: { name: string, id?: string }): string {
  const { name, id } = action
  return channelName(name, id)
}
