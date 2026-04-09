export type PrintOrder = {
  tracking_number: string | null;
  customer_name: string;
  shipping_address: string;
  items: { id: string; name: string; quantity: number }[];
};
