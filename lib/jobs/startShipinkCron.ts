import { runShipinkOrderSync } from "@/lib/jobs/syncOrdersToShipink";

const INTERVAL_MS = 10 * 60 * 1000;

let started = false;
let running = false;

export function startShipinkCronScheduler(): void {
  if (started) return;
  started = true;

  if (process.env.DISABLE_SHIPINK_CRON === "true") {
    console.info("[SHIPINK_CRON] DISABLE_SHIPINK_CRON=true — dahili zamanlayıcı kapalı.");
    return;
  }

  // Vercel Hobby: vercel.json günlük cron (03:00 UTC); ödeme push'u birincil yol
  if (process.env.VERCEL === "1") {
    console.info("[SHIPINK_CRON] Vercel ortamı — günlük platform cron (yedek).");
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[SHIPINK_CRON] Geliştirme ortamı — dahili zamanlayıcı başlatılmadı.");
    return;
  }

  const tick = async () => {
    if (running) {
      console.warn("[SHIPINK_CRON] Önceki tur hâlâ çalışıyor, atlanıyor.");
      return;
    }
    running = true;
    try {
      const result = await runShipinkOrderSync();
      console.info(
        `[SHIPINK_CRON] Tamamlandı: ${result.synced} başarılı, ${result.failed} hata (${result.duration}ms)`,
      );
    } catch (err) {
      console.error("[SHIPINK_CRON] Tur hatası:", err);
    } finally {
      running = false;
    }
  };

  console.info("[SHIPINK_CRON] Her 10 dakikada bir çalışacak şekilde başlatıldı.");
  void tick();
  setInterval(() => void tick(), INTERVAL_MS);
}
