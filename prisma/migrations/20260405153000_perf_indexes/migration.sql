-- Performance indexes for product filtering, cart access, and collection joins

CREATE INDEX IF NOT EXISTS "Product_price_idx" ON "Product"("price");
CREATE INDEX IF NOT EXISTS "Product_isActive_price_idx" ON "Product"("isActive", "price");
CREATE INDEX IF NOT EXISTS "Product_isActive_categoryId_gender_createdAt_idx"
  ON "Product"("isActive", "categoryId", "gender", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_fabricType_idx" ON "Product"("fabricType");

CREATE INDEX IF NOT EXISTS "ProductColor_name_idx" ON "ProductColor"("name");
CREATE INDEX IF NOT EXISTS "ProductColor_productId_name_idx" ON "ProductColor"("productId", "name");

CREATE INDEX IF NOT EXISTS "ProductVariant_productId_isActive_idx" ON "ProductVariant"("productId", "isActive");
CREATE INDEX IF NOT EXISTS "ProductVariant_price_idx" ON "ProductVariant"("price");
CREATE INDEX IF NOT EXISTS "ProductVariant_stock_stockReserved_idx" ON "ProductVariant"("stock", "stockReserved");

CREATE INDEX IF NOT EXISTS "ProductSize_name_idx" ON "ProductSize"("name");

CREATE INDEX IF NOT EXISTS "CartItem_userId_updatedAt_idx" ON "CartItem"("userId", "updatedAt");

CREATE INDEX IF NOT EXISTS "CollectionProduct_collectionId_idx" ON "CollectionProduct"("collectionId");
CREATE INDEX IF NOT EXISTS "CollectionProduct_productId_idx" ON "CollectionProduct"("productId");
