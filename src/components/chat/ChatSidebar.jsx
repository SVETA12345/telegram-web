import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveChat } from '../../services/slices/chatSlice'
import { logout } from '../../services/slices/authSlice'
import { stopReceiving } from '../../services/thunks/receiving'
import { formatTime } from '../../lib/phone'
import Avatar from './Avatar'
import NewChatModal from './NewChatModal'

export default function ChatSidebar() {
  const dispatch = useDispatch()
  const chats = useSelector((state) => state.chat.chats)
  const activeChatId = useSelector((state) => state.chat.activeChatId)
  const isReceiving = useSelector((state) => state.chat.isReceiving)
  const [modalOpen, setModalOpen] = useState(false)

  const list = Object.values(chats).sort((a, b) => b.lastActivity - a.lastActivity)

  const handleLogout = () => {
    stopReceiving()
    dispatch(logout())
  }

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div className="sidebar__brand">
          <img src="/telegram.svg" alt="Telegram" width={32} height={32} />
          <span>Telegram</span>
        </div>
        <div className="sidebar__header-actions">
          <button type="button" className="icon-button" title="Выйти" onClick={handleLogout}>
            ⎋
          </button>
        </div>
      </header>

      <div className="sidebar__toolbar">
        <button
          type="button"
          className="button button--primary sidebar__new"
          onClick={() => setModalOpen(true)}
        >
          + Новый чат
        </button>
        <span
          className={`status-dot ${isReceiving ? 'status-dot--on' : ''}`}
          title={isReceiving ? 'Приём сообщений активен' : 'Приём остановлен'}
        />
      </div>

      <div className="sidebar__list">
        {list.length === 0 && (
          <p className="sidebar__empty">Нет чатов. Создайте новый чат по номеру телефона или @username.</p>
        )}
        {list.map((chat) => {
          const last = chat.messages[chat.messages.length - 1]
          const preview = last ? `${last.outgoing ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'
          return (
            <button
              type="button"
              key={chat.id}
              className={`chat-item ${chat.id === activeChatId ? 'chat-item--active' : ''}`}
              onClick={() => dispatch(setActiveChat(chat.id))}
            >
              <Avatar name={chat.name} seed={chat.id} size={48} />
              <div className="chat-item__body">
                <div className="chat-item__top">
                  <span className="chat-item__name">{chat.name}</span>
                  {last && <span className="chat-item__time">{formatTime(last.timestamp)}</span>}
                </div>
                <div className="chat-item__bottom">
                  <span className="chat-item__preview">{preview}</span>
                  {chat.unread > 0 && <span className="chat-item__badge">{chat.unread}</span>}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {modalOpen && <NewChatModal onClose={() => setModalOpen(false)} />}
    </aside>
  )
}
