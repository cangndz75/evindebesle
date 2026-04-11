import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { runOrderPostPaymentTasks } from '@/lib/services/order-post-payment';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const orderWorker = new Worker(
  'OrderPostPayment',
  async (job: Job) => {
    const { orderId } = job.data;
    console.log(`[Worker] İşlem başladı. Sipariş ID: ${orderId}`);
    await runOrderPostPaymentTasks(orderId);
    console.log(`[Worker] İşlem başarıyla tamamlandı. Sipariş ID: ${orderId}`);
  },
  { connection }
);

orderWorker.on('completed', (job) => {
  console.log(`Job ${job.id} başarıyla bitti.`);
});

orderWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} hata aldı. Hata: ${err.message}`);
});
