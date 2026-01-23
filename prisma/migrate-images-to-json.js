import { Pool } from "pg";
import { config } from "dotenv";

// .env dosyasını yükle
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log("🔄 ProductColor images alanlarını JSON string'e dönüştürülüyor...");

  try {
    // Önce kolon tipini kontrol et
    const typeCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ProductColor' 
      AND column_name = 'images'
    `);

    console.log("📊 Mevcut kolon tipi:", typeCheck.rows[0]?.data_type);

    // Önce array verilerini JSON string'e dönüştür (geçici bir kolon kullanarak)
    console.log("📝 1. Adım: Array verilerini JSON string'e dönüştürülüyor...");
    
    // Geçici bir kolon oluştur
    await pool.query(`
      ALTER TABLE "ProductColor" 
      ADD COLUMN IF NOT EXISTS "images_temp" TEXT
    `);

    // Array verilerini JSON string'e dönüştür ve geçici kolona yaz
    const convertResult = await pool.query(`
      UPDATE "ProductColor"
      SET "images_temp" = CASE
        WHEN images IS NULL THEN '[]'
        WHEN pg_typeof(images) = 'text[]'::regtype THEN to_json(images)::text
        ELSE '[]'
      END
    `);

    console.log(`✅ ${convertResult.rowCount} kayıt dönüştürüldü`);

    // Eski kolonu sil
    console.log("📝 2. Adım: Eski kolon siliniyor...");
    await pool.query(`
      ALTER TABLE "ProductColor" 
      DROP COLUMN IF EXISTS "images"
    `);

    // Geçici kolonu images olarak yeniden adlandır
    console.log("📝 3. Adım: Yeni kolon oluşturuluyor...");
    await pool.query(`
      ALTER TABLE "ProductColor" 
      RENAME COLUMN "images_temp" TO "images"
    `);

    // Kontrol et
    const verifyResult = await pool.query(`
      SELECT id, images, pg_typeof(images) as type
      FROM "ProductColor"
      LIMIT 5
    `);

    console.log("✅ Güncellenmiş kayıtlar:", verifyResult.rows);
    console.log("✅ Migration tamamlandı!");
  } catch (error) {
    console.error("❌ Hata:", error);
    
    // Alternatif yöntem: Her kaydı tek tek güncelle
    console.log("⚠️  Alternatif yöntem deneniyor...");
    
    try {
      const colors = await pool.query(`
        SELECT id, images
        FROM "ProductColor"
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
          let jsonString = "[]";
          
          if (color.images === null || color.images === undefined) {
            jsonString = "[]";
          } else if (Array.isArray(color.images)) {
            jsonString = JSON.stringify(color.images);
          } else if (typeof color.images === "string") {
            // Zaten string, kontrol et
            if (color.images.startsWith("[")) {
              jsonString = color.images;
            } else {
              jsonString = JSON.stringify([color.images]);
            }
          } else {
            // Object olabilir (PostgreSQL array object)
            const values = Object.values(color.images).filter(v => typeof v === "string");
            jsonString = JSON.stringify(values);
          }

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
    } catch (altError) {
      console.error("❌ Alternatif yöntem de başarısız:", altError);
      throw altError;
    }
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
