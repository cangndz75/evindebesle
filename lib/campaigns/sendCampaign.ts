import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { renderEmailHtml, replaceVariables } from "@/lib/email/renderEmail";

type SendCampaignParams = {
  campaignId: string;
  recipientEmail?: string | null;
  recipientEmails?: string[] | null;
};

type CampaignRecipient = {
  id?: string;
  email: string;
  name?: string | null;
};

export async function sendCampaignNow({ campaignId, recipientEmail, recipientEmails }: SendCampaignParams) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  let blocks: any[];
  let storedRecipientEmails: string[] = [];
  try {
    const parsedContent = JSON.parse(campaign.contentJson || "[]");
    if (Array.isArray(parsedContent)) {
      blocks = parsedContent;
    } else {
      blocks = Array.isArray(parsedContent?.blocks) ? parsedContent.blocks : [];
      storedRecipientEmails = Array.isArray(parsedContent?.recipientEmails)
        ? parsedContent.recipientEmails
        : [];
    }
  } catch {
    throw new Error("Campaign content is invalid");
  }

  const recipients = await resolveRecipients({
    recipientEmail,
    recipientEmails: recipientEmails && recipientEmails.length > 0 ? recipientEmails : storedRecipientEmails,
    audienceSegmentId: campaign.audienceSegmentId,
  });

  if (recipients.length === 0) {
    throw new Error("No recipients found");
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dark-velvet.com";

  let sentCount = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    try {
      const emailSend = await prisma.emailSend.create({
        data: {
          campaignId: campaign.id,
          userId: recipient.id || null,
          email: recipient.email,
          status: "pending",
        },
      });

      const html = renderEmailHtml(blocks, {
        baseUrl,
        trackingId: emailSend.trackingId,
        campaignId: campaign.id,
      });

      const personalizedHtml = replaceVariables(html, {
        user_name: recipient.name || "Degerli Musterimiz",
        user_email: recipient.email,
        user_first_name: recipient.name?.split(" ")[0] || "Degerli Musterimiz",
        coupon_code: "HOSGELDIN",
      });

      const { error } = await resend.emails.send({
        from: `${campaign.fromName} <${campaign.fromEmail}>`,
        to: recipient.email,
        subject: campaign.subject || "Dark Velvet",
        html: personalizedHtml,
        replyTo: campaign.replyTo || undefined,
        headers: {
          "X-Campaign-ID": campaign.id,
          "X-Tracking-ID": emailSend.trackingId,
        },
      });

      if (error) {
        await prisma.emailSend.update({
          where: { id: emailSend.id },
          data: { status: "failed" },
        });
        errors.push(`${recipient.email}: ${error.message}`);
      } else {
        await prisma.emailSend.update({
          where: { id: emailSend.id },
          data: {
            status: "sent",
            sentAt: new Date(),
          },
        });
        sentCount++;
      }
    } catch {
      errors.push(`${recipient.email}: Processing error`);
    }
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: "sent",
      sentAt: new Date(),
      sentCount,
    },
  });

  return {
    sentCount,
    totalRecipients: recipients.length,
    errors,
  };
}

type ResolveRecipientsParams = {
  recipientEmail?: string | null;
  recipientEmails?: string[] | null;
  audienceSegmentId?: string | null;
};

async function resolveRecipients({ recipientEmail, recipientEmails, audienceSegmentId }: ResolveRecipientsParams): Promise<CampaignRecipient[]> {
  if (recipientEmail) {
    const user = await prisma.user.findUnique({
      where: { email: recipientEmail },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      return [user];
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { email: recipientEmail },
      select: { email: true },
    });

    if (subscriber) {
      return [{ email: subscriber.email, name: subscriber.email.split("@")[0] }];
    }

    return [{ email: recipientEmail, name: recipientEmail.split("@")[0] }];
  }

  if (recipientEmails && recipientEmails.length > 0) {
    const normalizedEmails = Array.from(
      new Set(
        recipientEmails
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean)
      )
    );

    if (normalizedEmails.length === 0) {
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        email: { in: normalizedEmails },
        marketingEmailConsent: true,
      },
      select: { id: true, email: true, name: true },
    });

    const subscribers = await prisma.subscriber.findMany({
      where: { email: { in: normalizedEmails }, isActive: true },
      select: { email: true },
    });

    const usersByEmail = new Map(users.map((user) => [user.email.toLowerCase(), user]));
    const subscribersByEmail = new Set(subscribers.map((subscriber) => subscriber.email.toLowerCase()));

    const eligibleRecipients = normalizedEmails.flatMap((email) => {
      const matchedUser = usersByEmail.get(email);
      if (matchedUser) {
        return [matchedUser];
      }

      if (subscribersByEmail.has(email)) {
        return [{ email, name: email.split("@")[0] }];
      }

      return [];
    });

    return eligibleRecipients;
  }

  const userSelect = {
    id: true,
    email: true,
    name: true,
  };

  const userWhere: Record<string, any> = {
    marketingEmailConsent: true,
  };

  let users: CampaignRecipient[] = [];
  let anonymousSubscribers: CampaignRecipient[] = [];

  if (audienceSegmentId === "active") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    users = await prisma.user.findMany({
      where: {
        ...userWhere,
        orders: { some: { createdAt: { gte: thirtyDaysAgo } } },
      },
      select: userSelect,
    });
  } else if (audienceSegmentId === "inactive") {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    users = await prisma.user.findMany({
      where: {
        ...userWhere,
        OR: [
          { orders: { none: {} } },
          { orders: { every: { createdAt: { lt: ninetyDaysAgo } } } },
        ],
      },
      select: userSelect,
    });
  } else {
    users = await prisma.user.findMany({
      where: userWhere,
      select: userSelect,
    });

    const subscribers = await prisma.subscriber.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    anonymousSubscribers = subscribers.map((s) => ({
      email: s.email,
      name: s.email.split("@")[0],
    }));
  }

  const allRecipients = [...users, ...anonymousSubscribers];
  const uniqueRecipients = Array.from(
    new Map(allRecipients.map((r) => [r.email, r])).values()
  );

  return uniqueRecipients;
}
