import { createSlice } from '@reduxjs/toolkit'
import { formatPhone, normalizePhone } from '../../lib/phone'

const STORAGE_KEY = 'telegram-chat:chats'

function loadSavedChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const initialState = {
  chats: loadSavedChats(),
  activeChatId: null,
  isReceiving: false,
  receiveError: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    createChat: (state, action) => {
      const { chatId, phone, name } = action.payload
      if (!chatId) return
      const digits = normalizePhone(phone)
      if (!state.chats[chatId]) {
        state.chats[chatId] = {
          id: chatId,
          phone: digits,
          name: name?.trim() || (digits ? formatPhone(digits) : chatId),
          messages: [],
          lastActivity: Date.now(),
          unread: 0,
        }
      }
      state.activeChatId = chatId
    },
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload
      if (action.payload) {
        const chat = state.chats[action.payload]
        if (chat) chat.unread = 0
      }
    },
    deleteChat: (state, action) => {
      delete state.chats[action.payload]
      if (state.activeChatId === action.payload) {
        state.activeChatId = null
      }
    },
    addOutgoingMessage: (state, action) => {
      const chat = state.chats[action.payload.chatId]
      if (!chat) return
      chat.messages.push(action.payload.message)
      chat.lastActivity = action.payload.message.timestamp
    },
    addIncomingMessage: (state, action) => {
      const { chatId, phone, name, message } = action.payload
      let chat = state.chats[chatId]
      if (!chat) {
        const digits = normalizePhone(phone)
        chat = {
          id: chatId,
          phone: digits,
          name: name?.trim() || (digits ? formatPhone(digits) : chatId),
          messages: [],
          lastActivity: message.timestamp,
          unread: 0,
        }
        state.chats[chatId] = chat
      }
      chat.messages.push(message)
      chat.lastActivity = message.timestamp
      if (state.activeChatId === chatId) {
        chat.unread = 0
      } else {
        chat.unread += 1
      }
    },
    updateMessage: (state, action) => {
      const { id, status, newId } = action.payload
      for (const chat of Object.values(state.chats)) {
        const message = chat.messages.find((item) => item.id === id)
        if (message) {
          if (status) message.status = status
          if (newId) message.id = newId
          break
        }
      }
    },
    setReceiving: (state, action) => {
      state.isReceiving = action.payload
    },
    setReceiveError: (state, action) => {
      state.receiveError = action.payload
    },
  },
})

export const {
  createChat,
  setActiveChat,
  deleteChat,
  addOutgoingMessage,
  addIncomingMessage,
  updateMessage,
  setReceiving,
  setReceiveError,
} = chatSlice.actions
export default chatSlice.reducer
