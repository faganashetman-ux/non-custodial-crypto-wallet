'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const en = {
  common: { loading: 'Starting XIPHER…', cancel: 'Cancel', close: 'Close', copied: 'Copied', copyAddress: 'Copy address', max: 'MAX', balance: 'Balance', available: 'Available' },
  tabs: { wallet: 'Wallet', history: 'History', settings: 'Settings' },
  history: { title: 'Transaction History', empty: 'No transactions found', loading: 'Loading history...', error: 'Failed to load history', received: 'Received', sent: 'Sent' },
  auth: { setupTitle: 'Set up your wallet', welcomeBack: 'Welcome back', setupDesc: 'A non-custodial wallet for BSC, Ethereum & Tron.', unlockDesc: 'Enter your master password to unlock your wallet.', phraseLabel: 'Recovery phrase (12 words)', generatePhrase: 'Generate new phrase', pwPlaceholder: 'Master password', pwCreatePlaceholder: 'Create a master password', encryptBtn: 'Encrypt & enter', unlockBtn: 'Unlock', resetBtn: 'Use a different recovery phrase', warning: 'Your phrase is encrypted on this device.' },
  dashboard: { totalBalance: 'Total balance', assets: 'Assets', viewExplorer: 'View in explorer', receive: 'Receive', send: 'Send', swap: 'Swap', accountLabel: 'Account' },
  accounts: { title: 'Your accounts', desc1: 'Addresses on', desc2: 'derived from your phrase.', active: 'Active', copiedToast: 'Address copied!', errCopy: 'Could not copy', switchedToast: 'Switched to ', createNew: 'Create new account', enterName: 'Enter account name', createBtn: 'Create', rename: 'Rename', saveBtn: 'Save' },
  receive: { title: 'Receive', yourAddress: 'Your address', warning1: 'Only send', warning2: 'assets to this address.' },
  send: { title: 'Send', fromAccount: 'From:', gasBalance: 'Gas balance:', estimating: 'Estimating fee...', recipient: 'Recipient address', amount: 'Amount', estimateFee: 'Estimate network fee', feeError: 'Could not estimate.', feePrefix: 'Network fee:', btnSending: 'Sending…', btnConfirm: 'Confirm transfer', errAmount: 'Enter a recipient and amount.', errGas: 'Not enough gas.', successSend: 'sent successfully!', errSend: 'Transfer failed.' },
  swap: { title: 'Swap', ethWarning: 'Swaps on Ethereum are disabled.', youPay: 'You pay', youReceive: 'You receive', calcPlaceholder: 'Calculating…', btnApproving: 'Approving…', btnSwapping: 'Swapping…', btnSwap: 'Swap now', errNoRoute: 'No route found.', errGas: 'Not enough gas.', errEthDisabled: 'ETH swaps disabled.', errAmount: 'Enter amount.', successSwap: 'Swap completed!', errSwap: 'Swap failed.' },
  settingsScreen: { title: 'Settings', preferences: 'Preferences', language: 'Language', theme: 'Color Theme', security: 'Security', lockWallet: 'Lock Wallet', lockDesc: 'Require password to open' },
  // НОВОЕ: ДОНАТЫ
  donate: { title: 'Support Developer', btnDonate: 'Donate to developer', desc: 'Buy me a coffee ☕', thanks: 'Thanks for your support!', toDev: 'To Developer', sending: 'Sending...', confirm: 'Send Donation' }
}

const ru: typeof en = {
  common: { loading: 'Запуск XIPHER…', cancel: 'Отмена', close: 'Закрыть', copied: 'Скопировано', copyAddress: 'Скопировать адрес', max: 'МАКС', balance: 'Баланс', available: 'Доступно' },
  tabs: { wallet: 'Кошелек', history: 'История', settings: 'Настройки' },
  history: { title: 'История транзакций', empty: 'Транзакций пока нет', loading: 'Загрузка истории...', error: 'Не удалось загрузить историю', received: 'Получено', sent: 'Отправлено' },
  auth: { setupTitle: 'Создайте кошелек', welcomeBack: 'С возвращением', setupDesc: 'Некастодиальный кошелек для BSC, Ethereum и Tron.', unlockDesc: 'Введите мастер-пароль для разблокировки.', phraseLabel: 'Секретная фраза (12 слов)', generatePhrase: 'Сгенерировать новую фразу', pwPlaceholder: 'Мастер-пароль', pwCreatePlaceholder: 'Придумайте мастер-пароль', encryptBtn: 'Зашифровать и войти', unlockBtn: 'Разблокировать', resetBtn: 'Использовать другую сид-фразу', warning: 'Фраза зашифрована только на этом устройстве.' },
  dashboard: { totalBalance: 'Общий баланс', assets: 'Активы', viewExplorer: 'В обозревателе', receive: 'Принять', send: 'Отправить', swap: 'Обмен', accountLabel: 'Счет' },
  accounts: { title: 'Ваши счета', desc1: 'Адреса в сети', desc2: 'сгенерированы из вашей фразы.', active: 'Активен', copiedToast: 'Адрес скопирован!', errCopy: 'Ошибка копирования', switchedToast: 'Переключено на ', createNew: 'Создать новый счет', enterName: 'Название счета', createBtn: 'Создать', rename: 'Переименовать', saveBtn: 'Сохранить' },
  receive: { title: 'Принять', yourAddress: 'Ваш адрес', warning1: 'Отправляйте только', warning2: 'на этот адрес.' },
  send: { title: 'Отправить', fromAccount: 'Откуда:', gasBalance: 'Ваш газ:', estimating: 'Расчет комиссии...', recipient: 'Адрес получателя', amount: 'Сумма', estimateFee: 'Рассчитать комиссию', feeError: 'Ошибка расчета.', feePrefix: 'Комиссия:', btnSending: 'Отправка…', btnConfirm: 'Подтвердить перевод', errAmount: 'Заполните адрес и сумму.', errGas: 'Недостаточно газа.', successSend: 'успешно отправлены!', errSend: 'Ошибка перевода.' },
  swap: { title: 'Обмен', ethWarning: 'Обмен в Ethereum отключен.', youPay: 'Вы отдаете', youReceive: 'Вы получаете', calcPlaceholder: 'Считаем…', btnApproving: 'Разрешение…', btnSwapping: 'Обмен…', btnSwap: 'Обменять', errNoRoute: 'Нет маршрута.', errGas: 'Нет газа.', errEthDisabled: 'ETH обмен отключен.', errAmount: 'Введите сумму.', successSwap: 'Обмен завершен!', errSwap: 'Ошибка обмена.' },
  settingsScreen: { title: 'Настройки', preferences: 'Внешний вид', language: 'Язык', theme: 'Цветовая схема', security: 'Безопасность', lockWallet: 'Заблокировать кошелек', lockDesc: 'Потребуется ввод пароля' },
  // НОВОЕ: ДОНАТЫ
  donate: { title: 'Поддержать автора', btnDonate: 'Сделать пожертвование', desc: 'На кофе и развитие проекта ☕', thanks: 'Огромное спасибо за поддержку!', toDev: 'Разработчику', sending: 'Отправка...', confirm: 'Отправить донат' }
}

export type Language = 'en' | 'ru'
export type Dictionary = typeof en
const dictionaries: Record<Language, Dictionary> = { en, ru }
interface I18nContextType { lang: Language; t: Dictionary; setLang: (lang: Language) => void }
const I18nContext = createContext<I18nContextType | null>(null)

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('verdant.lang') as Language
    if (saved && (saved === 'en' || saved === 'ru')) setLangState(saved)
    else setLangState(navigator.language.startsWith('ru') ? 'ru' : 'en')
    setMounted(true)
  }, [])
  const setLang = (newLang: Language) => { setLangState(newLang); localStorage.setItem('verdant.lang', newLang) }
  if (!mounted) return null
  return <I18nContext.Provider value={{ lang, t: dictionaries[lang], setLang }}>{children}</I18nContext.Provider>
}