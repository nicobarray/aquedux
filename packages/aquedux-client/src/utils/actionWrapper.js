// This is called on actions to add AQUA before their types.
const actionWrapper = action => {
  // If this is not an action, do nothing.
  if (!action.type) return action

  // If the action is already wrapped, do nothing.
  if (action.type.indexOf('AQUA:') === 0) return action

  return {
    ...action,
    type: 'AQUA:' + action.type
  }
}

export default actionWrapper
