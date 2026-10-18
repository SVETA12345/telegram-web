import { deleteNotification, receiveNotification, setSettings } from '../../api/greenApi'
import { addIncomingMessage, setReceiveError, setReceiving, updateMessage } from '../slices/chatSlice'
import { normalizePhone } from '../../lib/phone'

let running = false
let activeController = null

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function mapStatus(status) {
  const normalized = status.toLowerCase()
  if (normalized.includes('read')) return 'read'
  if (normalized.includes('deliver')) return 'delivered'
  if (normalized.includes('fail')) return 'failed'
  return 'sent'
}

export function stopReceiving() {
  running = false
  if (activeController) {
    activeController.abort()
    activeController = null
  }
}

export const handleNotification = (body) => (dispatch, getState) => {
  if (body.typeWebhook === 'incomingMessageReceived') {
    const messageData = body.messageData
    const senderData = body.senderData
    if (!messageData || messageData.typeMessage !== 'textMessage' || !senderData) return

    const text = messageData.textMessageData?.textMessage
    if (!text) return

    const phone = senderData.senderPhoneNumber ? String(senderData.senderPhoneNumber) : ''
    const name =
      senderData.senderName ||
      senderData.senderContactName ||
      senderData.chatName ||
      phone ||
      senderData.chatId

    const existing = Object.values(getState().chat.chats).find(
      (chat) =>
        chat.id === senderData.chatId ||
        (phone !== '' && normalizePhone(chat.phone) === phone) ||
        normalizePhone(chat.id) === normalizePhone(senderData.chatId),
    )
    const chatId = existing?.id ?? senderData.chatId

    dispatch(
      addIncomingMessage({
        chatId,
        phone,
        name,
        message: {
          id: body.idMessage ?? `in-${Date.now()}`,
          text,
          timestamp: (body.timestamp ?? Math.floor(Date.now() / 1000)) * 1000,
          outgoing: false,
          status: 'read',
        },
      }),
    )
    return
  }

  if (body.typeWebhook === 'outgoingMessageStatus') {
    const status = body.statusData?.status ?? body.status
    const idMessage = body.idMessage ?? body.statusData?.idMessage
    if (status && idMessage) {
      dispatch(updateMessage({ id: idMessage, status: mapStatus(status) }))
    }
  }
}

export const startReceiving = () => async (dispatch, getState) => {
  if (running) return
  running = true
  const controller = new AbortController()
  activeController = controller
  const { signal } = controller
  dispatch(setReceiving(true))
  dispatch(setReceiveError(null))

  const credentials = getState().auth.credentials
  if (credentials) {
    try {
      await setSettings(credentials)
    } catch (error) {
      dispatch(setReceiveError(`Не удалось включить приём уведомлений: ${errorMessage(error)}`))
    }
  }

  let failures = 0
  while (running && !signal.aborted) {
    const { credentials: current, connected } = getState().auth
    if (!connected || !current) break

    try {
      const notification = await receiveNotification(current, 5, { signal })
      failures = 0
      if (notification?.body) {
        dispatch(handleNotification(notification.body))
      }
      if (notification && typeof notification.receiptId === 'number') {
        try {
          await deleteNotification(current, notification.receiptId, { signal })
        } catch {
        }
      }
    } catch (error) {
      if (signal.aborted || !running) break
      failures += 1
      dispatch(setReceiveError(errorMessage(error)))
      await delay(failures > 3 ? 5000 : 1500)
    }
  }

  running = false
  if (activeController === controller) activeController = null
  dispatch(setReceiving(false))
}
