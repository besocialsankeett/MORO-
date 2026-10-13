import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { cx } from "./ui";

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Pin labels can come from owner-entered text, so escape before handing them to Leaflet as HTML. */
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export interface MapPin {
  id: string;
  coords: [number, number];
  label: string;
}

export interface MapProps {
  center: [number, number];
  zoom?: number;
  pins?: MapPin[];
  activeId?: string | null;
  onPinClick?: (id: string) => void;
  /** Shows one draggable marker and reports its position — used by the owner location picker. */
  picker?: { value: [number, number]; onChange: (c: [number, number]) => void };
  className?: string;
  interactive?: boolean;
}

/** Thin wrapper around Leaflet. Price-pill markers for discovery, a draggable dot for picking. */
export default function MapView({ center, zoom = 12, pins, activeId, onPinClick, picker, className, interactive = true }: MapProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const dot = useRef<L.Marker | null>(null);
  const onChange = useRef(picker?.onChange);
  onChange.current = picker?.onChange;
  const onPin = useRef(onPinClick);
  onPin.current = onPinClick;

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { center, zoom, zoomControl: interactive, scrollWheelZoom: false, dragging: interactive, attributionControl: true });
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    if (picker) {
      m.on("click", (e) => onChange.current?.([e.latlng.lat, e.latlng.lng]));
    }
    // Leaflet measures its container on creation; re-measure once layout settles.
    const t = setTimeout(() => m.invalidateSize(), 60);
    return () => {
      clearTimeout(t);
      m.remove();
      map.current = null;
      dot.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.current?.setView(center, zoom, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom]);

  const pinKey = (pins ?? []).map((p) => `${p.id}:${p.label}`).join("|");
  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    for (const p of pins ?? []) {
      const icon = L.divIcon({ className: "", html: `<div class="moro-pin ${p.id === activeId ? "is-active" : ""}">${esc(p.label)}</div>`, iconSize: [0, 0], iconAnchor: [0, 0] });
      L.marker(p.coords, { icon, zIndexOffset: p.id === activeId ? 1000 : 0 })
        .on("click", () => onPin.current?.(p.id))
        .addTo(g);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinKey, activeId]);

  useEffect(() => {
    if (!picker || !map.current) return;
    if (!dot.current) {
      const icon = L.divIcon({ className: "", html: '<div class="moro-dot"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
      dot.current = L.marker(picker.value, { icon, draggable: true }).addTo(map.current);
      dot.current.on("dragend", () => {
        const p = dot.current!.getLatLng();
        onChange.current?.([p.lat, p.lng]);
      });
    } else {
      dot.current.setLatLng(picker.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picker?.value[0], picker?.value[1]]);

  return <div ref={el} className={cx("size-full", className)} />;
}
