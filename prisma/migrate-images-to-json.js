import { Pool } from "pg";
import { config } from "dotenv";

config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log("ğŸ”„ ProductColor images alanlarını JSON string'e dönüştürülüyor...");

  try {
    const typeCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ProductColor' 
      AND column_name = 'images'
    `);

    console.log("ğŸ“Š Mevcut kolon tipi:", typeCheck.rows[0]?.data_type);

    console.log("ğŸ“ 1. Adım: Array verilerini JSON string'e dönüştürülüyor...");
    
    await pool.query(`
      ALTER TABLE "ProductColor" 
      ADD COLUMN IF NOT EXISTS "images_temp" TEXT
    `);

    const convertResult = await pool.query(`
      UPDATE "ProductColor"
      SET "images_temp" = CASE
        WHEN images IS NULL THEN '[]'
        WHEN pg_typeof(images) = 'text[]'::regtype THEN to_json(images)::text
        ELSE '[]'
      END
    `);

    console.log(`✅ ${convertResult.rowCount} kayıt dönüştürüldü`);

    console.log("ğŸ“ 2. Adım: Eski kolon siliniyor...");
    await pool.query(`
      ALTER TABLE "ProductColor" 
      DROP COLUMN IF EXISTS "images"
    `);

    console.log("ğŸ“ 3. Adım: Yeni kolon oluşturuluyor...");
    await pool.query(`
      ALTER TABLE "ProductColor" 
      RENAME COLUMN "images_temp" TO "images"
    `);

    const verifyResult = await pool.query(`
      SELECT id, images, pg_typeof(images) as type
      FROM "ProductColor"
      LIMIT 5
    `);

    console.log("✅ Güncellenmiş kayıtlar:", verifyResult.rows);
    console.log("✅ Migration tamamlandı!");
  } catch (error) {
    console.error("âŒ Hata:", error);
    
    console.log("⚠️  Alternatif yöntem deneniyor...");
    
    try {
      const colors = await pool.query(`
        SELECT id, images
        FROM "ProductColor"
      `);

      console.log(`ğŸ“Š ${colors.rows.length} renk kaydı bulundu`);

      let updated = 0;
      let skipped = 0;

      for (const color of colors.rows) {
        try {
          if (typeof color.images === "string" && color.images.startsWith("[")) {
            try {
              JSON.parse(color.images);
              skipped++;
              continue;
            } catch {
            }
          }

          let jsonString = "[]";
          
          if (color.images === null || color.images === undefined) {
            jsonString = "[]";
          } else if (Array.isArray(color.images)) {
            jsonString = JSON.stringify(color.images);
          } else if (typeof color.images === "string") {
            if (color.images.startsWith("[")) {
              jsonString = color.images;
            } else {
              jsonString = JSON.stringify([color.images]);
            }
          } else {
            const values = Object.values(color.images).filter(v => typeof v === "string");
            jsonString = JSON.stringify(values);
          }

          await pool.query(
            `UPDATE "ProductColor" SET images = $1 WHERE id = $2`,
            [jsonString, color.id]
          );

          updated++;
        } catch (err) {
          console.error(`âŒ Hata (id: ${color.id}):`, err);
        }
      }

      console.log(`✅ ${updated} kayıt güncellendi`);
      console.log(`â­ï¸  ${skipped} kayıt atlandı (zaten JSON)`);
    } catch (altError) {
      console.error("âŒ Alternatif yöntem de başarısız:", altError);
      throw altError;
    }
  }
}

main()
  .catch((e) => {
    console.error("âŒ Hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
