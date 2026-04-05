-- Performance indexes for product filtering, cart access, and collection joins
-- Guard each block so shadow DB replays do not fail on older base schemas.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Product') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "Product_price_idx" ON "Product"("price")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "Product_isActive_price_idx" ON "Product"("isActive", "price")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "Product_isActive_categoryId_gender_createdAt_idx" ON "Product"("isActive", "categoryId", "gender", "createdAt")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "Product_fabricType_idx" ON "Product"("fabricType")';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProductColor') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "ProductColor_name_idx" ON "ProductColor"("name")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "ProductColor_productId_name_idx" ON "ProductColor"("productId", "name")';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProductVariant') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "ProductVariant_productId_isActive_idx" ON "ProductVariant"("productId", "isActive")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "ProductVariant_price_idx" ON "ProductVariant"("price")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "ProductVariant_stock_stockReserved_idx" ON "ProductVariant"("stock", "stockReserved")';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProductSize') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "ProductSize_name_idx" ON "ProductSize"("name")';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CartItem') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "CartItem_userId_updatedAt_idx" ON "CartItem"("userId", "updatedAt")';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CollectionProduct') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "CollectionProduct_collectionId_idx" ON "CollectionProduct"("collectionId")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "CollectionProduct_productId_idx" ON "CollectionProduct"("productId")';
  END IF;
END $$;
