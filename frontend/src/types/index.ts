export interface Item {
  item_id: string;
  name: string;
  location: string;
  specifications: Record<string, unknown>;
  available_quantity: number;
}