import { createOrderPostPaymentWorker } from "../../lib/queue/order-post-payment";
import { runOrderPostPaymentTasks } from "../../lib/services/order-post-payment";

const worker = createOrderPostPaymentWorker(async (data) => {
  await runOrderPostPaymentTasks(data.orderId);
});

worker.on("completed", (job) => {
  console.log(`[order-post-payment] completed job=${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[order-post-payment] failed job=${job?.id}`, err);
});

console.log("[order-post-payment] worker started");
