/**
 * Image asset configuration.
 *
 * Every photograph in the app is referenced by a key from this file, so
 * swapping imagery (or moving to local files in /public) is a one-file change.
 * Sources are Unsplash photos served from their CDN; `img()` requests a
 * right-sized crop. To use a local asset instead, set the value to a path
 * such as "/photos/atelier.jpg" — `img()` passes non-Unsplash paths through.
 */
export const photos = {
  // Salon interiors
  roomMirrors: "photo-1600948836101-f9ffda59d250",
  roomBright: "photo-1626383137804-ff908d2753a2",
  roomShelf: "photo-1626379501846-0df4067b8bb9",
  roomCorner: "photo-1626383120723-2a941488860d",
  roomNeon: "photo-1637777277337-f114350fb088",
  roomBarberDark: "photo-1781455793310-8427c96454c7",
  roomMono: "photo-1781925856343-c97d0d44f94c",
  roomArch: "photo-1746723378067-83a345ff3160",
  roomVintage: "photo-1758812818698-6ecd792a87da",
  roomGlass: "photo-1759134248487-e8baaf31e33e",
  roomBarbers: "photo-1776850476481-2bccba2e35c7",
  roomBasins: "photo-1637777269308-6a072f24e8a4",
  roomLounge: "photo-1600948836587-02c1842c9140",
  roomPlants: "photo-1600948835780-9c4a8b55cf50",
  roomStreet: "photo-1782596747899-e522836b328e",
  roomRound: "photo-1675034743339-0b0747047727",
  roomGreen: "photo-1695173122226-3a932002ab33",

  // Barbering
  barberRecline: "photo-1503951914875-452162b0f3f1",
  barberFade: "photo-1593702275687-f8b402bf1fb5",
  barberClipper: "photo-1493256338651-d82f7acb2b38",
  barberBeard: "photo-1705976062088-5433328c2dcd",
  barberDetail: "photo-1520338661084-680395057c93",
  barberBack: "photo-1514336937476-a5b961020a5c",
  barberDuo: "photo-1512864084360-7c0c4d0a0845",
  barberSide: "photo-1599351431408-433ef72fe40b",
  barberTowel: "photo-1739302493888-6f96cbc37105",
  barberTattoo: "photo-1541533848490-bc8115cd6522",
  barberComb: "photo-1606333259737-6da197890fa2",
  barberShave: "photo-1532710093739-9470acff878f",
  barberBun: "photo-1705976063063-af7d6b9a4083",

  // Styling, colour, care
  styleWash: "photo-1634449571010-02389ed0f9b0",
  styleBlowdry: "photo-1580618672591-eb180b1a973f",
  styleWindow: "photo-1562322140-8baeececf3df",
  styleCurl: "photo-1629397685944-7073f5589754",
  styleFoils: "photo-1712213396688-c6f2d536671f",
  styleCut: "photo-1707720531504-ce087725861a",
  styleUpdo: "photo-1672788694268-ecc234591d31",
  styleColour: "photo-1707979577466-2d6109c68a45",
  styleFinish: "photo-1634449571017-5fecfd26ad76",
  styleMono: "photo-1637308596973-231d1a9221f5",
  styleBasin: "photo-1648313143853-aa913f6ad44a",
  styleScissors: "photo-1613754773306-532ec48b0de5",

  // Skin
  skinMask: "photo-1570172619644-dfd03ed5d881",
  skinFacial: "photo-1552693673-1bf958298935",
  skinCalm: "photo-1728949202477-bad2935775cb",
} as const;

export type PhotoKey = keyof typeof photos;

/** Photos a salon owner can pick from during setup. */
export const ownerLibrary: PhotoKey[] = [
  "roomMirrors",
  "roomBright",
  "roomCorner",
  "roomMono",
  "roomBarbers",
  "roomArch",
  "roomLounge",
  "roomPlants",
  "roomBasins",
  "barberFade",
  "barberComb",
  "barberTattoo",
  "styleBlowdry",
  "styleWindow",
  "styleFoils",
  "skinFacial",
];

/**
 * Resolve a photo reference to a URL at the given pixel width.
 * Accepts a key from `photos`, a raw Unsplash id, or any absolute/local URL.
 */
export function img(ref: string, w = 900, h?: number): string {
  const id = (photos as Record<string, string>)[ref] ?? ref;
  if (!id.startsWith("photo-")) return id;
  const size = h ? `&w=${w}&h=${h}` : `&w=${w}`;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&q=72${size}`;
}
