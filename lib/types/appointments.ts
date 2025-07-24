export type AppointmentWithRelations = {
  id: string;
  confirmedAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELED";
  adminNote?: string | null;
  user: {
    name: string | null;
  };
  pets: {
    ownedPet?: {
      name: string | null;
    } | null;
  }[];
  services: {
    service: {
      id: string;
      name: string;
    };
  }[];
};
