import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
    console.log("Seeding automations...");

    // 1. Welcome Series
    // Use upsert or findFirst logic. Since we changed to findFirst in previous edit, let's keep it safe.

    // Welcome
    let welcome = await prisma.automation.findFirst({ where: { triggerType: "WELCOME" } });
    if (!welcome) {
        await prisma.automation.create({
            data: {
                name: "Hoşgeldin Serisi",
                triggerType: "WELCOME",
                isActive: true,
                steps: {
                    create: [
                        {
                            order: 0,
                            type: "EMAIL",
                            template: {
                                create: {
                                    name: "Welcome Email",
                                    subject: "Aramıza Hoşgeldin! 👋",
                                    bodyJson: "<h1>Hoşgeldin!</h1><p>Evinde Besle ailesine katıldığın için teşekkürler.</p>"
                                }
                            }
                        },
                        {
                            order: 1,
                            type: "DELAY",
                            delaySeconds: 172800 // 2 days
                        },
                        {
                            order: 2,
                            type: "EMAIL",
                            template: {
                                create: {
                                    name: "Brand Story",
                                    subject: "Biz Kimiz?",
                                    bodyJson: "<h1>Hikayemiz</h1><p>Doğal ve taze...</p>"
                                }
                            }
                        },
                        {
                            order: 3,
                            type: "DELAY",
                            delaySeconds: 172800 // 2 days
                        },
                        {
                            order: 4,
                            type: "EMAIL",
                            template: {
                                create: {
                                    name: "First Discount",
                                    subject: "Sana Özel %10 İndirim 🎁",
                                    bodyJson: "<h1>Kupon Kodun: WELCOME10</h1><p>İlk siparişinde kullanabilirsin.</p>"
                                }
                            }
                        }
                    ]
                }
            }
        });
        console.log("Created Welcome Series");
    }

    // Abandoned Cart
    let cart = await prisma.automation.findFirst({ where: { triggerType: "ABANDONED_CART" } });
    if (!cart) {
        await prisma.automation.create({
            data: {
                name: "Terk Edilen Sepet",
                triggerType: "ABANDONED_CART",
                isActive: true,
                steps: {
                    create: [
                        {
                            order: 0,
                            type: "EMAIL",
                            template: {
                                create: {
                                    name: "Cart Reminder",
                                    subject: "Sepetindekileri Unutma! 🛒",
                                    bodyJson: "<h1>Sepetin seni bekliyor</h1><p>Tükenmeden al.</p>"
                                }
                            }
                        }
                    ]
                }
            }
        });
        console.log("Created Cart Series");
    }

    // Win-back
    let winback = await prisma.automation.findFirst({ where: { triggerType: "WINBACK" } });
    if (!winback) {
        await prisma.automation.create({
            data: {
                name: "Geri Kazanım (Win-back)",
                triggerType: "WINBACK",
                isActive: true,
                steps: {
                    create: [
                        {
                            order: 0,
                            type: "EMAIL",
                            template: {
                                create: {
                                    name: "We Miss You",
                                    subject: "Seni Özledik 😢",
                                    bodyJson: "<h1>Uzun zaman oldu...</h1><p>Seni tekrar aramızda görmek istiyoruz.</p>"
                                }
                            }
                        }
                    ]
                }
            }
        });
        console.log("Created Win-back Series");
    }

    // Review Request
    let review = await prisma.automation.findFirst({ where: { triggerType: "REVIEW_REQUEST" } });
    if (!review) {
        await prisma.automation.create({
            data: {
                name: "Ürün Yorumu İsteği",
                triggerType: "REVIEW_REQUEST",
                isActive: true,
                steps: {
                    create: [
                        {
                            order: 0,
                            type: "DELAY",
                            delaySeconds: 259200 // 3 days
                        },
                        {
                            order: 1,
                            type: "EMAIL",
                            template: {
                                create: {
                                    name: "Review Request",
                                    subject: "Siparişinden memnun kaldın mı?",
                                    bodyJson: "<h1>Fikrin bizim için önemli</h1><p>Aldığın ürünleri değerlendir.</p>"
                                }
                            }
                        }
                    ]
                }
            }
        });
        console.log("Created Review Request Series");
    }

    console.log("Seeding completed successfully.");
}

main()
    .then(async () => {
        // Disconnect logic is handled in db.ts or pool, but explicit disconnect on script end is good.
        // Since we import 'prisma' from lib/db, we don't own the connection lifecycle fully, 
        // but for a script it's fine to just exit.
        // await prisma.$disconnect(); 
        process.exit(0);
    })
    .catch(async (e) => {
        console.error(e);
        process.exit(1);
    });
