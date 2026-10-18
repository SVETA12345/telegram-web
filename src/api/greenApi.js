export const DEFAULT_API_URL = 'https://api.green-api.com'
export const DEFAULT_TIMEOUT_MS = 30000

function normalizeUrl(apiUrl) {
  return (apiUrl || DEFAULT_API_URL).trim().replace(/\/+$/, '')
}

function instanceUrl(credentials) {
  return `${normalizeUrl(credentials.apiUrl)}/waInstance${credentials.idInstance.trim()}`
}

async function parseBody(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function extractError(data, status) {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = data.message
    if (typeof message === 'string' && message) return message
  }
  if (typeof data === 'string' && data) return data
  return `Ошибка запроса (HTTP ${status})`
}

function isAbortError(error) {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
}

async function request(credentials, path, init = {}, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options
  const controller = new AbortController()
  let timedOut = false
  let timeoutId = null

  const onExternalAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onExternalAbort, { once: true })
  }

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
  }

  try {
    const response = await fetch(`${instanceUrl(credentials)}/${path}`, {
      ...init,
      signal: controller.signal,
    })
    const data = await parseBody(response)
    if (!response.ok) {
      throw new Error(extractError(data, response.status))
    }
    return data
  } catch (error) {
    if (timedOut) {
      throw new Error(`Превышено время ожидания запроса (${Math.round(timeoutMs / 1000)} с)`)
    }
    if (isAbortError(error)) {
      throw new Error('Запрос отменён')
    }
    throw error
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    if (signal) signal.removeEventListener('abort', onExternalAbort)
  }
}

export function sendMessage(credentials, chatId, message, options) {
  return request(
    credentials,
    `sendMessage/${credentials.apiTokenInstance}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    },
    options,
  )
}

export function checkAccount(credentials, { phoneNumber, username, force } = {}, options) {
  const body = {}
  if (phoneNumber) body.phoneNumber = Number(phoneNumber)
  if (username) body.username = username
  if (force !== undefined) body.force = force
  return request(
    credentials,
    `checkAccount/${credentials.apiTokenInstance}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    options,
  )
}

export function receiveNotification(credentials, timeoutSeconds = 5, options = {}) {
  const timeoutMs = Math.max(options.timeoutMs ?? 0, (timeoutSeconds + 15) * 1000)
  return request(
    credentials,
    `receiveNotification/${credentials.apiTokenInstance}?receiveTimeout=${timeoutSeconds}`,
    {},
    { ...options, timeoutMs },
  )
}

export function deleteNotification(credentials, receiptId, options) {
  return request(
    credentials,
    `deleteNotification/${credentials.apiTokenInstance}/${receiptId}`,
    { method: 'DELETE' },
    options,
  )
}

export function getStateInstance(credentials, options) {
  return request(
    credentials,
    `getStateInstance/${credentials.apiTokenInstance}`,
    {},
    options,
  )
}

export function setSettings(
  credentials,
  settings = {
    webhookUrl: '',
    outgoingWebhook: 'yes',
    stateWebhook: 'yes',
    incomingWebhook: 'yes',
  },
  options,
) {
  return request(
    credentials,
    `setSettings/${credentials.apiTokenInstance}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    },
    options,
  )
}
