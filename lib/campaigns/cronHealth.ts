let lastCronRunAt: Date | null = null;

export const setCampaignCronHeartbeat = (at: Date = new Date()) => {
  lastCronRunAt = at;
};

export const getCampaignCronHeartbeat = () => lastCronRunAt;
