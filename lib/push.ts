import { supabase } from './supabase'
import { addressFor } from './wallet-core' // Импортируем твою функцию генерации
import { type NetworkId } from './networks'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function checkPushStatus(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (e) {
    return false;
  }
}

// === НОВАЯ ЛОГИКА: Принимаем seed и генерим 40 адресов ===
export async function subscribeToPushes(seed: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) throw new Error('No VAPID key');

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    const subInfo = JSON.parse(JSON.stringify(subscription));
    
    // Генерируем все адреса
    const networks: NetworkId[] = ['eth', 'bsc', 'tron', 'ton'];
    const payload = [];

    // Бежим по сетям и 10 аккаунтам
    for (const net of networks) {
      for (let i = 0; i < 10; i++) {
        const addr = await addressFor(seed, i, net);
        payload.push({
          wallet_address: addr.toLowerCase(), // Обязательно в нижний регистр для точного поиска
          sub_info: subInfo
        });
      }
    }

    // Сохраняем все 40 адресов разом в Supabase (Массовая вставка)
    const { error } = await supabase.from('push_subscriptions').insert(payload);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Push subscribe error:', error);
    return false;
  }
}

// === НОВАЯ ЛОГИКА: Отписываем телефон от всех 40 адресов сразу ===
export async function unsubscribeFromPushes(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return true;
    
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const subInfo = JSON.parse(JSON.stringify(subscription));
      
      // Удаляем из базы ВСЕ записи, привязанные к этому телефону (по endpoint)
      await supabase.from('push_subscriptions')
        .delete()
        .eq('sub_info->>endpoint', subInfo.endpoint); 

      await subscription.unsubscribe();
    }
    return true;
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return false;
  }
}