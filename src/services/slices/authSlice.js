import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { DEFAULT_API_URL, getStateInstance } from '../../api/greenApi'

const STORAGE_KEY = 'telegram-chat:credentials'

export function loadSavedCredentials() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.idInstance && parsed.apiTokenInstance) {
      return {
        apiUrl: parsed.apiUrl || DEFAULT_API_URL,
        idInstance: parsed.idInstance,
        apiTokenInstance: parsed.apiTokenInstance,
      }
    }
  } catch {
  }
  return null
}

const initialState = {
  credentials: loadSavedCredentials(),
  connected: false,
  status: 'idle',
  error: null,
}

function normalizeCredentials(credentials) {
  return {
    apiUrl: (credentials.apiUrl || DEFAULT_API_URL).trim().replace(/\/+$/, ''),
    idInstance: credentials.idInstance.trim(),
    apiTokenInstance: credentials.apiTokenInstance.trim(),
  }
}

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  const normalized = normalizeCredentials(credentials)
  try {
    await getStateInstance(normalized)
    return normalized
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Не удалось подключиться к GREEN-API'
    return rejectWithValue(message)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.credentials = null
      state.connected = false
      state.error = null
      state.status = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle'
        state.credentials = action.payload
        state.connected = true
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'idle'
        state.error = action.payload ?? 'Ошибка авторизации'
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
