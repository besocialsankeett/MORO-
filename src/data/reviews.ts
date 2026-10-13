import type { Salon } from "../types";

/**
 * SAMPLE reviews for the demo. The salons are fictional, so these are too:
 * they are shown on the page under a "sample" label and are never included
 * in structured data or presented as genuine customer feedback.
 */
export interface SampleReview {
  author: string;
  rating: number;
  when: string;
  text: string;
}

const POOL: Record<"barber" | "studio", SampleReview[]> = {
  barber: [
    { author: "Rahul M.", rating: 5, when: "2 weeks ago", text: "Booked at lunch, in the chair by six. Cleanest fade I’ve had in a year, and he actually asked how I wear it day to day." },
    { author: "Arjun S.", rating: 5, when: "1 month ago", text: "On time, no upsell, great beard line. The hot towel at the end is worth turning up early for." },
    { author: "Kevin D.", rating: 4, when: "1 month ago", text: "Really good cut. Gets busy on Saturdays, so I’d pick a weekday evening slot." },
    { author: "Sahil P.", rating: 5, when: "2 months ago", text: "Took my son for his first proper haircut. Patient, quick, and he walked out grinning." },
  ],
  studio: [
    { author: "Ananya R.", rating: 5, when: "3 weeks ago", text: "A proper consultation before anyone picked up scissors. The colour grew out so softly I went eight weeks without thinking about it." },
    { author: "Meera K.", rating: 5, when: "1 month ago", text: "Calm room, honest advice. She talked me out of a fringe and she was right." },
    { author: "Dhruv N.", rating: 4, when: "1 month ago", text: "Great restyle and a head massage I didn’t want to end. Parking nearby is tricky; take an auto." },
    { author: "Tanvi J.", rating: 5, when: "2 months ago", text: "The price on the app was the price at the till. Blow-dry lasted three days in monsoon humidity." },
  ],
};

export function sampleReviews(salon: Salon): SampleReview[] {
  if (salon.rating == null) return [];
  const kind = salon.services.some((s) => s.category === "colour") ? "studio" : "barber";
  const start = salon.name.length % POOL[kind].length;
  return [0, 1, 2].map((i) => POOL[kind][(start + i) % POOL[kind].length]);
}
