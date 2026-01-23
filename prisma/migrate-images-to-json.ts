import { Pool } from "pg";
import { config } from "dotenv";

// .env dosyasını yükle
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log("🔄 ProductColor images alanlarını JSON string'e dönüştürülüyor...");

  try {
    // PostgreSQL'de direkt SQL ile güncelleme yap
    // PostgreSQL array'i JSON string'e dönüştür
    const result = await pool.query(`
      UPDATE "ProductColor"
      SET images = CASE
        WHEN images IS NULL THEN '[]'::text
        WHEN images::text LIKE '[%' THEN images::text
        ELSE json_build_array(images)::text
      END
      WHERE images IS NOT NULL 
        AND images::text NOT LIKE '[%'
        AND images::text NOT LIKE '{%'
    `);

    console.log(`✅ ${result.rowCount} kayıt güncellendi`);

    // Şimdi array tipindeki verileri JSON string'e çevir
    const arrayResult = await pool.query(`
      UPDATE "ProductColor"
      SET images = to_json(images)::text
      WHERE images IS NOT NULL
        AND pg_typeof(images) = 'text[]'::regtype
    `);

    console.log(`✅ ${arrayResult.rowCount} array kayıt JSON'a dönüştürüldü`);
  } catch (error: any) {
    // Eğer yukarıdaki sorgu çalışmazsa, manuel olarak yap
    console.log("⚠️  Otomatik dönüştürme başarısız, manuel dönüştürme deneniyor...");
    
    const colors = await pool.query(`
      SELECT id, images
      FROM "ProductColor"
      WHERE images IS NOT NULL
    `);

    console.log(`📊 ${colors.rows.length} renk kaydı bulundu`);

    let updated = 0;
    let skipped = 0;

    for (const color of colors.rows) {
      try {
        // Eğer zaten JSON string ise, atla
        if (typeof color.images === "string" && color.images.startsWith("[")) {
          try {
            JSON.parse(color.images);
            skipped++;
            continue;
          } catch {
            // JSON değilse devam et
          }
        }

        // PostgreSQL array'i JSON string'e çevir
        const jsonResult = await pool.query(
          `SELECT to_json($1::text[])::text as json_string`,
          [color.images]
        );

        const jsonString = jsonResult.rows[0]?.json_string || "[]";

        await pool.query(
          `UPDATE "ProductColor" SET images = $1 WHERE id = $2`,
          [jsonString, color.id]
        );

        updated++;
      } catch (err) {
        console.error(`❌ Hata (id: ${color.id}):`, err);
      }
    }

    console.log(`✅ ${updated} kayıt güncellendi`);
    console.log(`⏭️  ${skipped} kayıt atlandı (zaten JSON)`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
