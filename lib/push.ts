import { supabase } from './supabase'
import { addressFor } from './wallet-core'
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

export async function subscribeToPushes(seed: string, totalAccounts: Record<string, number>): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) throw new Error('No VAPID key');

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    const subInfo = JSON.parse(JSON.stringify(subscription));
    const networks: NetworkId[] = ['eth', 'bsc', 'tron', 'ton'];
    const payload = [];

    for (const net of networks) {
      const count = totalAccounts[net] || 10; 
      for (let i = 0; i < count; i++) {
        const addr = await addressFor(seed, i, net);
        payload.push({
          wallet_address: addr.toLowerCase(),
          sub_info: subInfo
        });
      }
    }

    const { error } = await supabase.from('push_subscriptions').insert(payload);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Push subscribe error:', error);
    return false;
  }
}

export async function unsubscribeFromPushes(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return true;
    
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const subInfo = JSON.parse(JSON.stringify(subscription));
      
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

export async function addNewAddressToPushes(seed: string, network: NetworkId, index: number) {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const addr = await addressFor(seed, index, network);
    await supabase.from('push_subscriptions').insert([{
      wallet_address: addr.toLowerCase(),
      sub_info: JSON.parse(JSON.stringify(subscription))
    }]);
    
    console.log(`Address ${addr} appended to push database!`);
  } catch (error) {
    console.error('Failed to append new address to pushes:', error);
  }
}