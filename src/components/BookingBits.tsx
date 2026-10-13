import { useState } from "react";
import { useStore } from "../lib/store";
import { fmtDateLong, fmtTime, hoursUntil, toMin, fromMin } from "../lib/time";
import type { Booking, Salon } from "../types";
import { Button, Modal } from "./ui";

export const isUpcoming = (b: Booking) => (b.status === "confirmed" || b.status === "pending") && hoursUntil(b.date, b.time) > -b.duration / 60;

/** Build an .ics file in the browser so the appointment can be saved to any calendar. */
export function downloadIcs(b: Booking, salon: Salon) {
  const stamp = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
  const end = fromMin(Math.min(toMin(b.time) + b.duration, 23 * 60 + 59));
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MORO//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${b.id}@moro`,
    `DTSTART:${stamp(b.date, b.time)}`,
    `DTEND:${stamp(b.date, end)}`,
    `SUMMARY:${b.serviceNames.join(" + ")} at ${salon.name}`,
    `LOCATION:${salon.address.replace(/,/g, "\\,")}`,
    `DESCRIPTION:Booking reference ${b.code}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${salon.name.replace(/\W+/g, "-").toLowerCase()}-${b.date}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Cancellation dialog that states the salon's policy before the customer commits. */
export function CancelDialog({ booking, salon, onClose }: { booking: Booking | null; salon?: Salon; onClose: () => void }) {
  const { setStatus } = useStore();
  const [busy, setBusy] = useState(false);
  if (!booking || !salon) return <Modal open={false} onClose={onClose}>{null}</Modal>;
  const free = hoursUntil(booking.date, booking.time) >= salon.cancelHours;
  return (
    <Modal open onClose={onClose} title="Cancel this appointment?">
      <p className="-mt-2 text-ink-2">
        {booking.serviceNames.join(" + ")} at {salon.name} on {fmtDateLong(booking.date)}, {fmtTime(booking.time)}.
      </p>
      <div className={`mt-5 rounded-lg p-4 text-[0.9375rem] ${free ? "bg-ok-tint text-ok" : "bg-warn-tint text-warn"}`}>
        {free ? (
          <>
            <span className="font-semibold">You can cancel free of charge.</span> {salon.name} allows free cancellation up to {salon.cancelHours} hours before the appointment.
          </>
        ) : (
          <>
            <span className="font-semibold">This is a late cancellation.</span> It’s inside {salon.name}’s {salon.cancelHours}-hour window, so the salon may charge a fee on your next visit.
          </>
        )}
      </div>
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" onClick={onClose}>
          Keep appointment
        </Button>
        <Button
          size="lg"
          loading={busy}
          className="!bg-bad hover:!bg-[#8a1424]"
          onClick={() => {
            setBusy(true);
            setTimeout(() => {
              setStatus(booking.id, "cancelled");
              setBusy(false);
              onClose();
            }, 500);
          }}
        >
          Cancel appointment
        </Button>
      </div>
    </Modal>
  );
}
