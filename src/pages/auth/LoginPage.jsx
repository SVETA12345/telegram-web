import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../../services/slices/authSlice'
import { DEFAULT_API_URL } from '../../api/greenApi'

export default function LoginPage() {
  const dispatch = useDispatch()
  const { credentials, status, error } = useSelector((state) => state.auth)
  const [apiUrl, setApiUrl] = useState(credentials?.apiUrl ?? DEFAULT_API_URL)
  const [idInstance, setIdInstance] = useState(credentials?.idInstance ?? '')
  const [apiTokenInstance, setApiTokenInstance] = useState(credentials?.apiTokenInstance ?? '')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const loading = status === 'loading'
  const canSubmit = idInstance.trim() !== '' && apiTokenInstance.trim() !== '' && !loading

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit) return
    dispatch(login({ apiUrl, idInstance, apiTokenInstance }))
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__logo">
          <img src="/telegram.svg" alt="Telegram" width={64} height={64} />
        </div>
        <h1 className="login__title">Telegram</h1>
        <p className="login__subtitle">Веб-чат на базе GREEN-API</p>

        <label className="field">
          <span className="field__label">idInstance</span>
          <input
            className="field__input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="1101000001"
            value={idInstance}
            onChange={(event) => setIdInstance(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">apiTokenInstance</span>
          <input
            className="field__input"
            type="password"
            autoComplete="off"
            placeholder="Введите токен инстанса"
            value={apiTokenInstance}
            onChange={(event) => setApiTokenInstance(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="login__advanced-toggle"
          onClick={() => setShowAdvanced((value) => !value)}
        >
          {showAdvanced ? 'Скрыть дополнительные настройки' : 'Дополнительные настройки'}
        </button>

        {showAdvanced && (
          <label className="field">
            <span className="field__label">apiUrl</span>
            <input
              className="field__input"
              type="text"
              autoComplete="off"
              placeholder={DEFAULT_API_URL}
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
            />
          </label>
        )}

        {error && <p className="login__error">{error}</p>}

        <button className="button button--primary login__submit" type="submit" disabled={!canSubmit}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>

        <p className="login__hint">
          Параметры доступа:{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            console.green-api.com
          </a>
        </p>
      </form>
    </div>
  )
}
