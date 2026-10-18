import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import LoginPage from './pages/auth/LoginPage'
import ChatPage from './pages/chat/ChatPage'
import { startReceiving, stopReceiving } from './services/thunks/receiving'

export default function App() {
  const connected = useSelector((state) => state.auth.connected)
  const dispatch = useDispatch()

  useEffect(() => {
    if (connected) {
      dispatch(startReceiving())
    } else {
      stopReceiving()
    }
  }, [connected, dispatch])

  return connected ? <ChatPage /> : <LoginPage />
}
