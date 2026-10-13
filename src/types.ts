export type CategoryId = "haircuts" | "styling" | "beard" | "colour" | "treatments" | "skin";

export interface Service {
  id: string;
  category: CategoryId;
  name: string;
  description: string;
  /** minutes */
  duration: number;
  /** whole rupees */
  price: number;
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
}

/** Opening hours for one weekday, "HH:mm" 24h. null = closed. */
export type DayHours = { open: string; close: string } | null;

export interface Salon {
  id: string;
  name: string;
  tagline: string;
  description: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  coords: [number, number];
  rating: number | null;
  reviews: number;
  cover: string;
  gallery: string[];
  /** Sunday-first, length 7 */
  hours: DayHours[];
  services: Service[];
  stylists: Stylist[];
  /** Bookings are confirmed immediately rather than waiting for the salon. */
  instantConfirm: boolean;
  /** Free cancellation window, in hours before the appointment. */
  cancelHours: number;
  /** 0–100: share of slots already taken in generated demo availability. */
  busy: number;
  badge?: "New" | "Editor's pick";
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "declined";

export interface Booking {
  id: string;
  code: string;
  salonId: string;
  serviceIds: string[];
  /** Snapshot so history survives the salon editing its menu. */
  serviceNames: string[];
  stylistId: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number;
  total: number;
  customer: { name: string; phone: string };
  note?: string;
  status: BookingStatus;
  createdAt: number;
  /** "you" = made in this browser by the customer; "walk" = demo data for the owner side. */
  source: "you" | "demo";
}

export interface Block {
  salonId: string;
  date: string;
  time: string;
}

export interface City {
  id: string;
  name: string;
  center: [number, number];
  /** Where "you" are when geolocation isn't shared. */
  you: [number, number];
  areas: string[];
}
