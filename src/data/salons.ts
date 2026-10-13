import type { DayHours, Salon, Stylist } from "../types";
import { catalogue } from "./catalogue";
import type { PhotoKey } from "./images";

const day = (open: string, close: string): DayHours => ({ open, close });

/** Sunday-first week. `closed` is a weekday index, or -1 for open all week. */
const week = (open: string, close: string, closed = -1, sunClose?: string): DayHours[] =>
  Array.from({ length: 7 }, (_, i) => (i === closed ? null : day(open, i === 0 && sunClose ? sunClose : close)));

/** Price a subset of the master menu for one salon, rounded to the nearest ₹50. */
const menu = (ids: string[], mult: number) =>
  ids.map((id) => {
    const s = catalogue.find((c) => c.id === id)!;
    return { ...s, price: Math.max(100, Math.round((s.price * mult) / 50) * 50) };
  });

const team = (prefix: string, people: [string, string][]): Stylist[] =>
  people.map(([name, role], i) => ({ id: `${prefix}-${i + 1}`, name, role }));

interface Seed extends Omit<Salon, "services" | "stylists" | "gallery" | "cover" | "busy" | "cancelHours"> {
  cover: PhotoKey;
  gallery: PhotoKey[];
  menu: string[];
  mult: number;
  team: [string, string][];
  busy?: number;
  cancelHours?: number;
}

const BARBER = ["cut-signature", "cut-fade", "cut-kids", "beard-trim", "beard-shave", "beard-combo", "tr-massage", "sk-cleanup"];
const STUDIO = ["cut-signature", "cut-restyle", "cut-fringe", "style-blowdry", "style-occasion", "style-wash", "col-global", "col-roots", "col-balayage", "col-gloss", "tr-spa", "tr-keratin"];
const FULL = [...STUDIO, "cut-fade", "beard-trim", "tr-scalp", "tr-massage", "sk-cleanup", "sk-facial", "sk-threading", "sk-mani"];

const seeds: Seed[] = [
  {
    id: "atelier-noor",
    name: "Atelier Noor",
    tagline: "Quiet luxury cuts and colour, a minute from Carter Road.",
    description:
      "A calm, mirror-lined studio run by colourist Noor Merchant. Appointments are unhurried by design: every visit begins with a proper consultation and ends with a finish you can recreate at home. Known across Bandra for soft, lived-in balayage.",
    city: "mumbai",
    area: "Bandra West",
    address: "14 Pali Mala Road, Bandra West, Mumbai 400050",
    phone: "+91 22 5550 0142",
    coords: [19.0623, 72.8298],
    rating: 4.9,
    reviews: 412,
    cover: "roomMirrors",
    gallery: ["styleFoils", "styleBlowdry", "roomBasins", "styleWash"],
    hours: week("10:00", "20:30", 1),
    menu: STUDIO,
    mult: 1.5,
    team: [["Noor Merchant", "Founder · Colour director"], ["Kabir Anand", "Senior stylist"], ["Tara D’Souza", "Stylist"]],
    instantConfirm: true,
    badge: "Editor's pick",
    busy: 48,
  },
  {
    id: "brass-and-bone",
    name: "Brass & Bone",
    tagline: "A proper barbershop in the old mill district.",
    description:
      "Dark green walls, leather chairs and barbers who take their time. Brass & Bone does classic barbering well — sharp fades, straight-razor shaves and beard work — with good coffee while you wait.",
    city: "mumbai",
    area: "Lower Parel",
    address: "Unit 6, Mathuradas Mill Compound, Lower Parel, Mumbai 400013",
    phone: "+91 22 5550 0177",
    coords: [18.9985, 72.8262],
    rating: 4.8,
    reviews: 689,
    cover: "roomGreen",
    gallery: ["barberDuo", "barberFade", "barberComb", "barberShave"],
    hours: week("09:00", "21:00"),
    menu: BARBER,
    mult: 1.15,
    team: [["Imran Sheikh", "Head barber"], ["Rohan Pillai", "Barber"], ["Dev Malhotra", "Barber"]],
    instantConfirm: true,
    busy: 42,
  },
  {
    id: "saltwater-studio",
    name: "Saltwater Studio",
    tagline: "Bright, beachy and good with texture.",
    description:
      "A sunlit room two lanes back from Juhu beach. The team specialises in waves, curls and effortless finishes, and keeps the menu short so everything on it is done properly.",
    city: "mumbai",
    area: "Juhu",
    address: "3 Gulmohar Cross Road 9, Juhu, Mumbai 400049",
    phone: "+91 22 5550 0128",
    coords: [19.1058, 72.8291],
    rating: 4.7,
    reviews: 236,
    cover: "roomBright",
    gallery: ["styleWindow", "styleCurl", "styleFinish", "roomShelf"],
    hours: week("10:00", "20:00", 2),
    menu: ["cut-signature", "cut-restyle", "cut-fringe", "style-blowdry", "style-occasion", "col-gloss", "col-balayage", "tr-spa", "tr-scalp"],
    mult: 1.25,
    team: [["Alisha Fernandes", "Founder · Stylist"], ["Meher Kapoor", "Curl specialist"]],
    instantConfirm: false,
    busy: 30,
  },
  {
    id: "fold-hair-lab",
    name: "Fold Hair Lab",
    tagline: "Precision cutting in a Colaba heritage building.",
    description:
      "Fold is a three-chair studio with a single focus: shape. Expect architectural bobs, considered layers and stylists who will tell you honestly what suits your hair.",
    city: "mumbai",
    area: "Colaba",
    address: "2nd floor, 27 Mereweather Road, Colaba, Mumbai 400001",
    phone: "+91 22 5550 0163",
    coords: [18.9218, 72.8327],
    rating: 4.8,
    reviews: 158,
    cover: "roomCorner",
    gallery: ["styleCut", "styleScissors", "styleMono", "roomPlants"],
    hours: week("11:00", "20:00", 1),
    menu: ["cut-signature", "cut-restyle", "cut-fringe", "cut-fade", "style-blowdry", "style-wash", "col-gloss", "col-roots", "tr-scalp"],
    mult: 1.7,
    team: [["Zoya Irani", "Creative director"], ["Arjun Bhatia", "Senior stylist"], ["Naina Rao", "Stylist"]],
    instantConfirm: true,
    busy: 55,
  },
  {
    id: "charcoal-barber-co",
    name: "Charcoal Barber Co.",
    tagline: "Walk-in energy, booked-ahead convenience.",
    description:
      "The neighbourhood favourite off Lokhandwala. Fast, friendly and consistent — the kind of place where the barber remembers your number two on the sides.",
    city: "mumbai",
    area: "Andheri West",
    address: "Shop 11, Sundervan Complex, Andheri West, Mumbai 400053",
    phone: "+91 22 5550 0119",
    coords: [19.1391, 72.8312],
    rating: 4.5,
    reviews: 921,
    cover: "roomMono",
    gallery: ["barberDetail", "barberTattoo", "barberClipper", "barberBun"],
    hours: week("09:30", "22:00"),
    menu: BARBER,
    mult: 0.8,
    team: [["Sameer Qureshi", "Owner · Barber"], ["Nikhil Shetty", "Barber"], ["Faizan Ali", "Barber"]],
    instantConfirm: true,
    busy: 28,
  },
  {
    id: "oleander",
    name: "Oleander",
    tagline: "Hair, skin and an hour to yourself.",
    description:
      "A full-service salon beside Powai lake with separate rooms for skin and hair. Go for the signature facial, stay for the hair spa. Products are stocked to take home.",
    city: "mumbai",
    area: "Powai",
    address: "Ground floor, Ventura, Hiranandani Gardens, Powai, Mumbai 400076",
    phone: "+91 22 5550 0185",
    coords: [19.1187, 72.9093],
    rating: 4.6,
    reviews: 344,
    cover: "roomArch",
    gallery: ["skinMask", "skinFacial", "styleColour", "roomLounge"],
    hours: week("10:00", "21:00", -1, "19:00"),
    menu: FULL,
    mult: 1,
    team: [["Priya Nambiar", "Salon director"], ["Sana Khan", "Skin therapist"], ["Vikram Joshi", "Stylist"], ["Leena Thomas", "Colourist"]],
    instantConfirm: true,
    busy: 35,
  },
  {
    id: "marigold-house",
    name: "Marigold House",
    tagline: "A bungalow salon under the banyans of Lane 6.",
    description:
      "Set in a converted Koregaon Park bungalow, Marigold House feels more like visiting a friend than keeping an appointment. Hair, skin and nails, with a garden to wait in.",
    city: "pune",
    area: "Koregaon Park",
    address: "Bungalow 41, Lane 6, Koregaon Park, Pune 411001",
    phone: "+91 20 5550 0131",
    coords: [18.5374, 73.8952],
    rating: 4.8,
    reviews: 287,
    cover: "roomLounge",
    gallery: ["styleUpdo", "styleBlowdry", "skinCalm", "roomPlants"],
    hours: week("10:00", "20:00", 1),
    menu: FULL,
    mult: 1.1,
    team: [["Rhea Kulkarni", "Founder"], ["Aditi Deshpande", "Senior stylist"], ["Farah Sayed", "Skin therapist"]],
    instantConfirm: true,
    badge: "Editor's pick",
    busy: 40,
  },
  {
    id: "northlight-barbers",
    name: "Northlight Barbers",
    tagline: "Clean fades and good conversation on Baner Road.",
    description:
      "Three chairs, big windows and a playlist people ask about. Northlight keeps things simple: excellent fades, tidy beards and appointments that run on time.",
    city: "pune",
    area: "Baner",
    address: "Shop 4, Pan Card Club Road, Baner, Pune 411045",
    phone: "+91 20 5550 0156",
    coords: [18.5601, 73.7851],
    rating: 4.7,
    reviews: 503,
    cover: "roomBarbers",
    gallery: ["barberSide", "barberBack", "barberTowel", "barberBeard"],
    hours: week("09:00", "21:00"),
    menu: BARBER,
    mult: 0.9,
    team: [["Omkar Jadhav", "Head barber"], ["Yash Patil", "Barber"]],
    instantConfirm: true,
    busy: 33,
  },
  {
    id: "studio-indigo",
    name: "Studio Indigo",
    tagline: "Colour specialists with a soft spot for copper.",
    description:
      "Pune’s colour-first studio. From subtle glosses to full transformations, the team plans every appointment around the health of your hair. Newly opened in Kalyani Nagar.",
    city: "pune",
    area: "Kalyani Nagar",
    address: "1st floor, Cerebrum Plaza, Kalyani Nagar, Pune 411014",
    phone: "+91 20 5550 0148",
    coords: [18.5478, 73.9018],
    rating: null,
    reviews: 0,
    cover: "roomNeon",
    gallery: ["styleFinish", "styleCurl", "styleScissors", "styleBasin"],
    hours: week("10:30", "20:30", 3),
    menu: STUDIO,
    mult: 1.2,
    team: [["Ishita Bose", "Colour director"], ["Karan Mehta", "Stylist"]],
    instantConfirm: false,
    badge: "New",
    busy: 15,
  },
  {
    id: "tin-roof",
    name: "The Tin Roof",
    tagline: "Old-school barbering off 12th Main.",
    description:
      "Red chairs, hot towels and barbers who learned the trade the long way. The Tin Roof has been cutting Indiranagar’s hair since before the pubs arrived.",
    city: "bengaluru",
    area: "Indiranagar",
    address: "618, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
    phone: "+91 80 5550 0114",
    coords: [12.9702, 77.6389],
    rating: 4.8,
    reviews: 1042,
    cover: "roomVintage",
    gallery: ["barberRecline", "barberShave", "barberComb", "roomStreet"],
    hours: week("09:00", "20:30", 2),
    menu: BARBER,
    mult: 1,
    team: [["Suresh Gowda", "Master barber"], ["Anil Reddy", "Barber"], ["Joel Mathew", "Barber"]],
    instantConfirm: true,
    busy: 50,
  },
  {
    id: "verde",
    name: "Verde",
    tagline: "A plant-filled salon with serious colour credentials.",
    description:
      "Round mirrors, trailing pothos and a team trained in London and Mumbai. Verde is where Koramangala goes for a restyle — and for the head massage that comes with every wash.",
    city: "bengaluru",
    area: "Koramangala",
    address: "80 Feet Road, 4th Block, Koramangala, Bengaluru 560034",
    phone: "+91 80 5550 0172",
    coords: [12.9349, 77.6269],
    rating: 4.9,
    reviews: 376,
    cover: "roomRound",
    gallery: ["styleMono", "styleWash", "styleWindow", "styleColour"],
    hours: week("10:00", "20:00", 1),
    menu: FULL,
    mult: 1.35,
    team: [["Ananya Iyer", "Founder · Stylist"], ["Rahul Menon", "Colourist"], ["Diya Hegde", "Stylist"], ["Sneha Rao", "Skin therapist"]],
    instantConfirm: true,
    badge: "Editor's pick",
    busy: 46,
  },
  {
    id: "hundred-feet",
    name: "Hundred Feet Grooming",
    tagline: "Late hours for people with long days.",
    description:
      "A modern grooming room built for the HSR after-work crowd. Open until eleven, with a short, sharp menu of cuts, shaves and scalp treatments.",
    city: "bengaluru",
    area: "HSR Layout",
    address: "27th Main Road, Sector 2, HSR Layout, Bengaluru 560102",
    phone: "+91 80 5550 0139",
    coords: [12.9121, 77.6446],
    rating: 4.4,
    reviews: 198,
    cover: "roomBarberDark",
    gallery: ["roomGlass", "barberFade", "barberDuo", "barberClipper"],
    hours: week("12:00", "23:00"),
    menu: [...BARBER, "tr-scalp", "style-wash"],
    mult: 0.85,
    team: [["Pranav Nair", "Owner · Barber"], ["Tenzin Dorji", "Barber"]],
    instantConfirm: true,
    busy: 22,
  },
];

export const seedSalons: Salon[] = seeds.map(({ menu: ids, mult, team: people, busy, cancelHours, ...rest }) => ({
  ...rest,
  services: menu(ids, mult),
  stylists: team(rest.id, people),
  busy: busy ?? 35,
  cancelHours: cancelHours ?? 3,
}));
