export type AppointmentWithRelations = {
  id: string;
  confirmedAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELED";
  adminNote?: string | null;
  user: {
    name: string | null;
  };
  ownedPet: {
    name: string;
  };
  services: {
    service: {
      id: string;
      name: string;
    };
  }[];
};
