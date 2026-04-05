import { Pool } from "pg";
import { config } from "dotenv";

config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log("ğŸ”„ ProductColor images alanlarÄ±nÄ± JSON string'e dÃ¶nÃ¼ÅŸtÃ¼rÃ¼lÃ¼yor...");

  try {
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

    console.log(`âœ… ${result.rowCount} kayÄ±t gÃ¼ncellendi`);

    const arrayResult = await pool.query(`
      UPDATE "ProductColor"
      SET images = to_json(images)::text
      WHERE images IS NOT NULL
        AND pg_typeof(images) = 'text[]'::regtype
    `);

    console.log(`âœ… ${arrayResult.rowCount} array kayÄ±t JSON'a dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼`);
  } catch (error: any) {
    console.log("âš ï¸  Otomatik dÃ¶nÃ¼ÅŸtÃ¼rme baÅŸarÄ±sÄ±z, manuel dÃ¶nÃ¼ÅŸtÃ¼rme deneniyor...");
    
    const colors = await pool.query(`
      SELECT id, images
      FROM "ProductColor"
      WHERE images IS NOT NULL
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
        console.error(`âŒ Hata (id: ${color.id}):`, err);
      }
    }

    console.log(`âœ… ${updated} kayÄ±t gÃ¼ncellendi`);
    console.log(`â­ï¸  ${skipped} kayÄ±t atlandÄ± (zaten JSON)`);
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
