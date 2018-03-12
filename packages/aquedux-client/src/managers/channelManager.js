let innerState = {
    channelReducers: {}
}

export default {
    define: (name, reducer) => {
        innerState.channelReducers[name] = reducer
    },
    reduce: (name) => (prevState, action) => {
        return innerState.channelReducers[name](prevState, action)
    }
}