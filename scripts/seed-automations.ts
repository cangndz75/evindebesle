import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
    console.log("Seeding automations...");


    let welcome = await prisma.automation.findFirst({ where: { triggerType: "WELCOME" } });
    if (!welcome) {
        await prisma.automation.create({
            data: {
                name: "HoÅŸgeldin Serisi",
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
                                    subject: "AramÄ±za HoÅŸgeldin! ğŸ‘‹",
                                    bodyJson: "<h1>HoÅŸgeldin!</h1><p>Evinde Besle ailesine katÄ±ldÄ±ÄŸÄ±n iÃ§in teÅŸekkÃ¼rler.</p>"
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
                                    bodyJson: "<h1>Hikayemiz</h1><p>DoÄŸal ve taze...</p>"
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
                                    subject: "Sana Ã–zel %10 Ä°ndirim ğŸ",
                                    bodyJson: "<h1>Kupon Kodun: WELCOME10</h1><p>Ä°lk sipariÅŸinde kullanabilirsin.</p>"
                                }
                            }
                        }
                    ]
                }
            }
        });
        console.log("Created Welcome Series");
    }

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
                                    subject: "Sepetindekileri Unutma! ğŸ›’",
                                    bodyJson: "<h1>Sepetin seni bekliyor</h1><p>TÃ¼kenmeden al.</p>"
                                }
                            }
                        }
                    ]
                }
            }
        });
        console.log("Created Cart Series");
    }

    let winback = await prisma.automation.findFirst({ where: { triggerType: "WINBACK" } });
    if (!winback) {
        await prisma.automation.create({
            data: {
                name: "Geri KazanÄ±m (Win-back)",
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
                                    subject: "Seni Ã–zledik ğŸ˜¢",
                                    bodyJson: "<h1>Uzun zaman oldu...</h1><p>Seni tekrar aramÄ±zda gÃ¶rmek istiyoruz.</p>"
                                }
                            }
                        }
                    ]
                }
            }
        });
        console.log("Created Win-back Series");
    }

    let review = await prisma.automation.findFirst({ where: { triggerType: "REVIEW_REQUEST" } });
    if (!review) {
        await prisma.automation.create({
            data: {
                name: "ÃœrÃ¼n Yorumu Ä°steÄŸi",
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
                                    subject: "SipariÅŸinden memnun kaldÄ±n mÄ±?",
                                    bodyJson: "<h1>Fikrin bizim iÃ§in Ã¶nemli</h1><p>AldÄ±ÄŸÄ±n Ã¼rÃ¼nleri deÄŸerlendir.</p>"
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
        process.exit(0);
    })
    .catch(async (e) => {
        console.error(e);
        process.exit(1);
    });
