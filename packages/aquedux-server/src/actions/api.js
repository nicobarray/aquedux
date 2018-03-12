// @flow

import actionTypes from '../constants/actionTypes'

const setRemoveType = (typeToSet: string) => ({
  type: actionTypes.api.AQUEDUX_REMOVE_TYPE_SET,
  typeToSet
})

export default {
  setRemoveType
}
