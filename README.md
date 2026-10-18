# Telegram Web Chat

Веб-интерфейс для обмена **текстовыми** сообщениями в мессенджере Telegram через сервис
[GREEN-API](https://green-api.com/telegram).

Реализовано по тестовому заданию на позицию «Фронтенд-разработчик React».

## Возможности

- Вход по учётным данным GREEN-API: `idInstance` и `apiTokenInstance`.
- Создание нового чата: резолв получателя (телефон или `@username`) в `chatId` через
  [CheckAccount](https://green-api.com/telegram/docs/api/service/CheckAccount/).
- Отправка текстовых сообщений (метод
  [SendMessage](https://green-api.com/telegram/docs/api/sending/SendMessage/)).
- Получение входящих сообщений через
  [HTTP API](https://green-api.com/telegram/docs/api/receiving/technology-http-api/)
  (`receiveNotification` + `deleteNotification`).
- Интерфейс чата в стиле мессенджера Telegram.
- Сохранение учётных данных и истории чатов в `localStorage`.

## Стек

- **React 18** + **JavaScript**
- **Redux Toolkit** + **react-redux** (хранение состояния и данных)
- **Vite** (сборка)
- **Docker** + **nginx** (запуск)

## Структура

```
src/
├── api/greenApi.js             # обёртка над методами GREEN-API
├── app/                        # store и хуки
├── features/
│   ├── auth/                   # авторизация (idInstance, apiTokenInstance)
│   └── chat/                   # чаты, список, окно чата, приём уведомлений
├── lib/phone.js                # работа с номерами, форматирование
└── index.css                   # стили
```

## Запуск через Docker (рекомендуется)

```bash
docker compose up --build
```

Приложение будет доступно по адресу <http://localhost:8080>.

Порт можно изменить в `docker-compose.yml` (левая часть в `"8080:80"`).

## Локальная разработка

```bash
npm install
npm run dev
```

Откройте <http://localhost:5173>.

Сборка production-версии:

```bash
npm run build
npm run preview
```

## Как пользоваться

1. Создайте инстанс в [личном кабинете GREEN-API](https://console.green-api.com) и
   авторизуйте его в приложении Telegram.
2. Скопируйте `idInstance` и `apiTokenInstance`.
3. Введите их на странице входа и нажмите **Войти**.
   - По умолчанию используется `apiUrl = https://api.green-api.com`. Если в личном
     кабинете указан другой хост, откройте **Дополнительные настройки** и впишите его.
4. Нажмите **+ Новый чат**, введите номер телефона получателя (например,
   `79991234567`) или его `@username` и создайте чат. Приложение проверит наличие
   аккаунта и получит числовой `chatId`.
5. Напишите сообщение и отправьте его.
6. Ответ получателя появится в чате автоматически.

## Как это работает

- При подключении приложение вызывает `setSettings` с пустым `webhookUrl` и
  включёнными `incomingWebhook`/`outgoingWebhook`/`stateWebhook`, чтобы включить
  получение уведомлений по технологии HTTP API.
- Далее запускается цикл длинного опроса: `receiveNotification` (таймаут 5 c),
  обработка, затем `deleteNotification` по `receiptId`.
- Перед созданием чата вызывается `checkAccount` с `phoneNumber` или `username`;
  в ответ приходит `chatId` (числовая строка вида `"10000000"`).
- Исходящие сообщения отправляются методом `sendMessage` на этот `chatId`; статусы
  доставки обновляются по уведомлениям `outgoingMessageStatus`.

## Ограничения

- Поддерживаются только текстовые сообщения (по условию задания).
- Отправка/получение возможны только после авторизации инстанса.
