import { Queue, Worker } from "bullmq";

export type OrderPostPaymentJobData = {
  orderId: string;
};

const QUEUE_NAME = "order-post-payment";

function getRedisUrl() {
  return (
    process.env.BULLMQ_REDIS_URL ||
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_URL ||
    ""
  ).trim();
}

function getBullMqConnection() {
  const redisUrl = getRedisUrl();
  if (!redisUrl) return null;
  return { connection: { url: redisUrl } };
}

let queueInstance: Queue<OrderPostPaymentJobData> | null = null;

function getOrderPostPaymentQueue() {
  if (queueInstance) return queueInstance;
  const config = getBullMqConnection();
  if (!config) return null;
  queueInstance = new Queue<OrderPostPaymentJobData>(QUEUE_NAME, {
    connection: config.connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 200,
      removeOnFail: 500,
    },
  });
  return queueInstance;
}

export function isOrderPostPaymentQueueEnabled() {
  return Boolean(getBullMqConnection());
}

export async function enqueueOrderPostPaymentJob(data: OrderPostPaymentJobData) {
  const queue = getOrderPostPaymentQueue();
  if (!queue) {
    return { queued: false as const };
  }

  await queue.add("process", data, {
    jobId: `order:${data.orderId}`,
  });

  return { queued: true as const };
}

export function createOrderPostPaymentWorker(
  processor: (data: OrderPostPaymentJobData) => Promise<void>
) {
  const config = getBullMqConnection();
  if (!config) {
    throw new Error("BULLMQ_REDIS_URL / REDIS_URL / UPSTASH_REDIS_URL tanimli degil");
  }

  return new Worker<OrderPostPaymentJobData>(
    QUEUE_NAME,
    async (job) => {
      await processor(job.data);
    },
    {
      connection: config.connection,
      concurrency: 5,
    }
  );
}
