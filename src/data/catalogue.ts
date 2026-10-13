import type { CategoryId, City, Service } from "../types";
import type { PhotoKey } from "./images";

export const categories: { id: CategoryId; name: string; blurb: string; photo: PhotoKey }[] = [
  { id: "haircuts", name: "Haircuts", blurb: "Cuts, fades and restyles", photo: "barberComb" },
  { id: "styling", name: "Styling", blurb: "Blow-dries and occasion hair", photo: "styleBlowdry" },
  { id: "beard", name: "Beard & shave", blurb: "Shape-ups and hot-towel shaves", photo: "barberShave" },
  { id: "colour", name: "Colour", blurb: "Balayage, gloss and root work", photo: "styleFoils" },
  { id: "treatments", name: "Treatments", blurb: "Spa, keratin and scalp care", photo: "styleWash" },
  { id: "skin", name: "Skin & beauty", blurb: "Facials, clean-ups and nails", photo: "skinFacial" },
];

export const categoryName = (id: CategoryId) => categories.find((c) => c.id === id)!.name;

/** Master service menu. Salons pick from this and apply their own pricing. */
export const catalogue: Service[] = [
  { id: "cut-signature", category: "haircuts", name: "Signature cut", description: "Consultation, wash, precision cut and finish.", duration: 45, price: 700 },
  { id: "cut-restyle", category: "haircuts", name: "Restyle", description: "A full change of shape, with time to talk it through first.", duration: 60, price: 1100 },
  { id: "cut-fade", category: "haircuts", name: "Skin fade", description: "Clipper fade taken down to skin, blended by hand.", duration: 45, price: 600 },
  { id: "cut-kids", category: "haircuts", name: "Kids’ cut", description: "For under-twelves. Patient hands, quick finish.", duration: 30, price: 400 },
  { id: "cut-fringe", category: "haircuts", name: "Fringe trim", description: "A tidy-up between full appointments.", duration: 15, price: 200 },

  { id: "style-blowdry", category: "styling", name: "Blow-dry", description: "Wash and a smooth or bouncy finish that lasts.", duration: 40, price: 650 },
  { id: "style-occasion", category: "styling", name: "Occasion styling", description: "Updos, waves and sets for weddings and evenings out.", duration: 60, price: 1500 },
  { id: "style-wash", category: "styling", name: "Wash & finish", description: "Shampoo, condition and a simple dry.", duration: 30, price: 400 },

  { id: "beard-trim", category: "beard", name: "Beard shape & trim", description: "Lined up with clippers and finished with a blade.", duration: 25, price: 350 },
  { id: "beard-shave", category: "beard", name: "Hot-towel shave", description: "Pre-shave oil, warm lather and a straight razor.", duration: 35, price: 500 },
  { id: "beard-combo", category: "beard", name: "Cut & beard", description: "Signature cut with a full beard shape-up.", duration: 70, price: 900 },

  { id: "col-global", category: "colour", name: "Global colour", description: "Roots to ends in a single shade, ammonia-free on request.", duration: 120, price: 3200 },
  { id: "col-roots", category: "colour", name: "Root touch-up", description: "Regrowth coverage matched to your existing colour.", duration: 75, price: 1600 },
  { id: "col-balayage", category: "colour", name: "Balayage", description: "Hand-painted lightness with a soft, lived-in grow-out.", duration: 180, price: 6500 },
  { id: "col-gloss", category: "colour", name: "Gloss & tone", description: "Refreshes faded colour and adds shine.", duration: 45, price: 1400 },

  { id: "tr-spa", category: "treatments", name: "Hair spa", description: "Deep-conditioning mask, steam and a long scalp massage.", duration: 60, price: 1500 },
  { id: "tr-keratin", category: "treatments", name: "Keratin smoothing", description: "Tames frizz for up to three months.", duration: 180, price: 6000 },
  { id: "tr-scalp", category: "treatments", name: "Scalp detox", description: "Exfoliating treatment for build-up and dryness.", duration: 45, price: 1200 },
  { id: "tr-massage", category: "treatments", name: "Head massage", description: "Warm oil, firm pressure, thirty quiet minutes.", duration: 30, price: 500 },

  { id: "sk-cleanup", category: "skin", name: "Express clean-up", description: "Cleanse, exfoliate and mask for a quick reset.", duration: 40, price: 900 },
  { id: "sk-facial", category: "skin", name: "Signature facial", description: "Tailored to your skin with extraction and massage.", duration: 75, price: 2400 },
  { id: "sk-threading", category: "skin", name: "Threading", description: "Brows shaped and tidied.", duration: 15, price: 150 },
  { id: "sk-mani", category: "skin", name: "Manicure", description: "Shape, cuticle care and a polish of your choice.", duration: 45, price: 800 },
];

export const cities: City[] = [
  {
    id: "mumbai",
    name: "Mumbai",
    center: [19.045, 72.845],
    you: [19.0552, 72.8301],
    areas: ["Bandra West", "Lower Parel", "Colaba", "Juhu", "Andheri West", "Powai"],
  },
  {
    id: "pune",
    name: "Pune",
    center: [18.545, 73.86],
    you: [18.5391, 73.8876],
    areas: ["Koregaon Park", "Kalyani Nagar", "Baner"],
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    center: [12.95, 77.63],
    you: [12.9755, 77.6387],
    areas: ["Indiranagar", "Koramangala", "HSR Layout"],
  },
];

export const cityById = (id: string) => cities.find((c) => c.id === id) ?? cities[0];
