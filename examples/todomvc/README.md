# Redux TodoMVC Example
## App
### Add aquedux-client dependency
`npm add aquedux-client`

### Configure Aquedux-client in `index.js`
```diff
 import React from 'react'
 import { render } from 'react-dom'
-import { createStore } from 'redux'
+/**
+ * Replace redux createStore by aqedux-client one
+ */
+import { createStore, createAqueduxClient, subscribeToChannel } from 'aquedux-client'
 import { Provider } from 'react-redux'
 import App from './components/App'
 import reducer from './reducers'
+/**
+ * Import actionTypes that will be share across the network
+ */
+import {
+  ADD_TODO,
+  DELETE_TODO,
+  EDIT_TODO,
+  COMPLETE_TODO,
+  COMPLETE_ALL_TODOS,
+  CLEAR_COMPLETED
+} from './constants/ActionTypes'
+
 import 'todomvc-app-css/index.css'
 
 const store = createStore(reducer)
 
+/**
+ * Configure aquedux-client with actionTypes and aquedux-server endpoint URL
+ */
+const aqueduxOptions = {
+  hydratedActionTypes: [ADD_TODO, DELETE_TODO, EDIT_TODO, COMPLETE_TODO, COMPLETE_ALL_TODOS, CLEAR_COMPLETED],
+  endpoint: 'http://localhost:4242/aquedux'
+}
+const client = createAqueduxClient(store, aqueduxOptions)
+
+/**
+ * Declare a channel with a way to reduce its snapshot
+ */
+client.addChannel('todos', (oldState, action) => {
+  return {
+    ...oldState,
+    todos: action.snapshot
+  }
+})
+/**
+ * Launch connection
+ */
+client.start()
+
+/**
+ * In a real world app, this dispatch should be done in a container/component at route level
+ */
+store.dispatch(subscribeToChannel('todos'))
+
render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```

### Configure 
## Server