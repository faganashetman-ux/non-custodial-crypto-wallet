import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Инициализируем БД
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Настраиваем отправку пушей (ВНИМАНИЕ: тут нужен VAPID_PRIVATE_KEY)
webpush.setVapidDetails(
  'mailto:your-email@gmail.com', // Замени на свой реальный email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY! // Этот ключ должен быть ТОЛЬКО в .env и на Vercel!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Пока мы просто тестируем, будем ждать такой JSON:
    // { "to": "0xТВОЙ_КОШЕЛЕК", "amount": "150", "token": "USDT" }
    const { to, amount, token } = body;

    if (!to) {
      return NextResponse.json({ error: 'Не указан адрес получателя (to)' }, { status: 400 });
    }

    // 1. Ищем этот адрес в нашей БД
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('sub_info')
      .eq('wallet_address', to.toLowerCase());

    if (error || !subs || subs.length === 0) {
      return NextResponse.json({ message: 'Для этого адреса не включены уведомления' });
    }

    // 2. Формируем красивое уведомление
    const notificationPayload = JSON.stringify({
      title: 'Входящий перевод! 💸',
      body: `На ваш кошелек зачислено ${amount} ${token || ''}`,
      url: '/' // Куда перекинет при клике на пуш
    });

    // 3. Рассылаем пуши на все устройства юзера (если у него их несколько)
    const sendPromises = subs.map((sub) =>
      webpush.sendNotification(sub.sub_info, notificationPayload).catch(async (e) => {
        console.error('Ошибка отправки пуша:', e);
        // Если токен протух (ошибка 410 Gone), удаляем его из базы
        if (e.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('sub_info->>endpoint', sub.sub_info.endpoint);
        }
      })
    );

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, message: `Отправлено ${subs.length} пушей!` });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}