import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addOutgoingMessage, setActiveChat, updateMessage } from '../../services/slices/chatSlice'
import { sendMessage } from '../../api/greenApi'
import { formatPhone, formatTime } from '../../lib/phone'
import Avatar from './Avatar'

function StatusIcon({ status }) {
  if (status === 'pending')
    return (
      <span className="msg__status" title="Отправляется">
        ◔
      </span>
    )
  if (status === 'failed')
    return (
      <span className="msg__status msg__status--failed" title="Ошибка отправки">
        !
      </span>
    )
  if (status === 'sent')
    return (
      <span className="msg__status" title="Отправлено">
        ✓
      </span>
    )
  if (status === 'delivered')
    return (
      <span className="msg__status" title="Доставлено">
        ✓✓
      </span>
    )
  return (
    <span className="msg__status msg__status--read" title="Прочитано">
      ✓✓
    </span>
  )
}

export default function ChatWindow() {
  const dispatch = useDispatch()
  const chat = useSelector((state) =>
    state.chat.activeChatId ? state.chat.chats[state.chat.activeChatId] : undefined,
  )
  const credentials = useSelector((state) => state.auth.credentials)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [chat?.messages.length, chat?.id])

  if (!chat) {
    return (
      <section className="chat-window chat-window--empty">
        <div className="chat-window__placeholder">
          <img src="/telegram.svg" alt="Telegram" width={72} height={72} />
          <h2>Выберите чат</h2>
          <p>Создайте новый чат или выберите существующий, чтобы начать переписку.</p>
        </div>
      </section>
    )
  }

  const activeChat = chat

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || !credentials || sending) return

    const tempId = `out-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    dispatch(
      addOutgoingMessage({
        chatId: activeChat.id,
        message: {
          id: tempId,
          text,
          timestamp: Date.now(),
          outgoing: true,
          status: 'pending',
        },
      }),
    )
    setDraft('')
    setSending(true)
    try {
      const response = await sendMessage(credentials, activeChat.id, text)
      dispatch(updateMessage({ id: tempId, status: 'sent', newId: response.idMessage }))
    } catch {
      dispatch(updateMessage({ id: tempId, status: 'failed' }))
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    handleSend()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const subtitle = activeChat.phone ? formatPhone(activeChat.phone) : activeChat.id

  return (
    <section className="chat-window">
      <header className="chat-window__header">
        <button
          type="button"
          className="chat-window__back"
          onClick={() => dispatch(setActiveChat(null))}
          title="К списку чатов"
        >
          ‹
        </button>
        <Avatar name={activeChat.name} seed={activeChat.id} size={40} />
        <div className="chat-window__title">
          <span className="chat-window__name">{activeChat.name}</span>
          <span className="chat-window__subtitle">{subtitle}</span>
        </div>
      </header>

      <div className="messages">
        {activeChat.messages.length === 0 && (
          <p className="messages__empty">Напишите первое сообщение получателю.</p>
        )}
        {activeChat.messages.map((message) => (
          <div key={message.id} className={`msg ${message.outgoing ? 'msg--out' : 'msg--in'}`}>
            <div className="msg__bubble">
              <span className="msg__text">{message.text}</span>
              <span className="msg__meta">
                <span className="msg__time">{formatTime(message.timestamp)}</span>
                {message.outgoing && <StatusIcon status={message.status} />}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          className="composer__input"
          rows={1}
          placeholder="Напишите сообщение…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="composer__send"
          type="submit"
          disabled={!draft.trim() || sending}
          title="Отправить"
        >
          ➤
        </button>
      </form>
    </section>
  )
}
