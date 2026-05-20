-- CreateIndex
CREATE UNIQUE INDEX "StockNotification_productId_email_variantId_key" ON "StockNotification"("productId", "email", "variantId");
