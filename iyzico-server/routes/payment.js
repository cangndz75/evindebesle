const express = require("express");
const Iyzipay = require("iyzipay");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const router = express.Router();

router.post("/initiate", (req, res) => {
  let {
    cardHolderName,
    cardNumber,
    expireMonth,
    expireYear,
    cvc,
    totalPrice,
    draftAppointmentId,
  } = req.body;

  // Eğer draftAppointmentId null/boşsa fallback olarak UUID ata
  if (!draftAppointmentId) {
    draftAppointmentId = uuidv4();
    console.warn("draftAppointmentId eksik, yeni ID atandı:", draftAppointmentId);
  }

  // Zorunlu alanları kontrol et
  if (
    !cardHolderName ||
    !cardNumber ||
    !expireMonth ||
    !expireYear ||
    !cvc ||
    !totalPrice
  ) {
    return res.status(400).json({ error: "Eksik bilgi var" });
  }

  // iyzipay nesnesini burada yaratıyoruz (isteğe bağlı olarak en üste de alabilirsiniz)
  const iyzipay = new Iyzipay({
    apiKey: process.env.IYZIPAY_API_KEY,
    secretKey: process.env.IYZIPAY_SECRET_KEY,
    uri: process.env.IYZIPAY_BASE_URL,
  });

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: uuidv4(),
    price: totalPrice.toString(),
    paidPrice: totalPrice.toString(),
    currency: Iyzipay.CURRENCY.TRY,
    installment: "1",
    basketId: draftAppointmentId,          // draftAppointmentId kullanılıyor
    paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    paymentCard: {
      cardHolderName,
      cardNumber: cardNumber.replace(/\s/g, ""),
      expireMonth,
      expireYear,
      cvc,
      registerCard: "0",
    },
    buyer: {
      id: "BY789",
      name: "Test",
      surname: "User",
      gsmNumber: "+905350000000",
      email: "test@iyzico.com",
      identityNumber: "74300864791",
      lastLoginDate: new Date().toISOString(),
      registrationDate: new Date().toISOString(),
      registrationAddress: "Test Mah. No:1",
      ip: req.ip,
      city: "İstanbul",
      country: "Türkiye",
      zipCode: "34700",
    },
    shippingAddress: {
      contactName: "Test User",
      city: "İstanbul",
      country: "Türkiye",
      address: "Test Mah. No:1",
      zipCode: "34700",
    },
    billingAddress: {
      contactName: "Test User",
      city: "İstanbul",
      country: "Türkiye",
      address: "Test Mah. No:1",
      zipCode: "34700",
    },
    basketItems: [
      {
        id: "BI101",
        name: "Evcil Hayvan Hizmeti",
        category1: "Hizmet",
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price: totalPrice.toString(),
      },
    ],
  };

  iyzipay.payment.create(request, (err, result) => {
    if (err) {
      console.error("💥 Sunucu hatası:", err);
      return res.status(500).json({ error: "Sunucu hatası", detail: err.message });
    }

    if (result.status === "success") {
      // 3D Secure gerekmiyorsa hemen return edilebilir, yoksa result.threeDSHtmlContent kullan.
      return res.json({ paymentPageHtml: result.threeDSHtmlContent || "" });
    } else {
      return res
        .status(400)
        .json({ error: result.errorMessage || "Ödeme reddedildi" });
    }
  });
});

module.exports = router;
