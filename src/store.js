import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import { STORE_NAME } from './consts'

const reducers = combineReducers({

})

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const preloadedState = JSON.parse(localStorage.getItem(STORE_NAME)) || undefined

export const store = createStore(
  reducers,
  preloadedState,
  composeEnhancers(
    applyMiddleware(thunk)
  )
)

store.subscribe(() => {
  const state = store.getState()
  localStorage.setItem(STORE_NAME, JSON.stringify(state))
})
