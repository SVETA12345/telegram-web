import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { checkAccount } from '../../api/greenApi'
import { createChat } from '../../services/slices/chatSlice'
import { formatPhone, normalizePhone } from '../../lib/phone'

export default function NewChatModal({ onClose }) {
  const dispatch = useDispatch()
  const credentials = useSelector((state) => state.auth.credentials)
  const [recipient, setRecipient] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const digits = normalizePhone(recipient)
  const username = recipient.trim().startsWith('@') ? recipient.trim() : ''
  const valid = digits.length >= 10 || username.length >= 3

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!valid || busy || !credentials) return

    setBusy(true)
    setError(null)
    try {
      const query = username ? { username } : { phoneNumber: digits }
      const result = await checkAccount(credentials, query)

      if (!result || result.exist !== true || !result.chatId) {
        setError('Аккаунт Telegram не найден по этим данным')
        return
      }

      const resolvedPhone = result.phoneNumber ? String(result.phoneNumber) : digits
      dispatch(
        createChat({
          chatId: String(result.chatId),
          phone: resolvedPhone,
          name: name.trim() || result.username || (resolvedPhone ? formatPhone(resolvedPhone) : ''),
        }),
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось проверить получателя')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal" onMouseDown={onClose}>
      <form
        className="modal__card"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="modal__title">Новый чат</h2>
        <p className="modal__subtitle">
          Введите номер телефона (79991234567) или имя пользователя (@username)
        </p>

        <label className="field">
          <span className="field__label">Получатель</span>
          <input
            className="field__input"
            type="text"
            inputMode="text"
            autoFocus
            placeholder="79991234567 или @username"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
          />
        </label>

        {digits.length >= 10 && <p className="modal__preview">{formatPhone(digits)}</p>}
        {username && <p className="modal__preview">{username}</p>}

        <label className="field">
          <span className="field__label">Имя (необязательно)</span>
          <input
            className="field__input"
            type="text"
            placeholder="Например, Иван"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        {error && <p className="modal__error">{error}</p>}

        <div className="modal__actions">
          <button type="button" className="button button--ghost" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button type="submit" className="button button--primary" disabled={!valid || busy}>
            {busy ? 'Проверяем…' : 'Создать чат'}
          </button>
        </div>
      </form>
    </div>
  )
}
