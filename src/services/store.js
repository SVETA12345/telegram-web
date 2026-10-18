import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import chatReducer from './slices/chatSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
  },
})

let persistTimer

store.subscribe(() => {
  if (persistTimer) return
  persistTimer = setTimeout(() => {
    persistTimer = undefined
    const state = store.getState()
    try {
      if (state.auth.credentials) {
        localStorage.setItem('telegram-chat:credentials', JSON.stringify(state.auth.credentials))
      } else {
        localStorage.removeItem('telegram-chat:credentials')
      }
      localStorage.setItem('telegram-chat:chats', JSON.stringify(state.chat.chats))
    } catch {
    }
  }, 250)
})
