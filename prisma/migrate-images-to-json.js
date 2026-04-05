import { Pool } from "pg";
import { config } from "dotenv";

config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log("ğŸ”„ ProductColor images alanlarÄ±nÄ± JSON string'e dÃ¶nÃ¼ÅŸtÃ¼rÃ¼lÃ¼yor...");

  try {
    const typeCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ProductColor' 
      AND column_name = 'images'
    `);

    console.log("ğŸ“Š Mevcut kolon tipi:", typeCheck.rows[0]?.data_type);

    console.log("ğŸ“ 1. AdÄ±m: Array verilerini JSON string'e dÃ¶nÃ¼ÅŸtÃ¼rÃ¼lÃ¼yor...");
    
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

    console.log(`âœ… ${convertResult.rowCount} kayÄ±t dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼`);

    console.log("ğŸ“ 2. AdÄ±m: Eski kolon siliniyor...");
    await pool.query(`
      ALTER TABLE "ProductColor" 
      DROP COLUMN IF EXISTS "images"
    `);

    console.log("ğŸ“ 3. AdÄ±m: Yeni kolon oluÅŸturuluyor...");
    await pool.query(`
      ALTER TABLE "ProductColor" 
      RENAME COLUMN "images_temp" TO "images"
    `);

    const verifyResult = await pool.query(`
      SELECT id, images, pg_typeof(images) as type
      FROM "ProductColor"
      LIMIT 5
    `);

    console.log("âœ… GÃ¼ncellenmiÅŸ kayÄ±tlar:", verifyResult.rows);
    console.log("âœ… Migration tamamlandÄ±!");
  } catch (error) {
    console.error("âŒ Hata:", error);
    
    console.log("âš ï¸  Alternatif yÃ¶ntem deneniyor...");
    
    try {
      const colors = await pool.query(`
        SELECT id, images
        FROM "ProductColor"
      `);

      console.log(`ğŸ“Š ${colors.rows.length} renk kaydÄ± bulundu`);

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

      console.log(`âœ… ${updated} kayÄ±t gÃ¼ncellendi`);
      console.log(`â­ï¸  ${skipped} kayÄ±t atlandÄ± (zaten JSON)`);
    } catch (altError) {
      console.error("âŒ Alternatif yÃ¶ntem de baÅŸarÄ±sÄ±z:", altError);
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
