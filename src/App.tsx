import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import { ArchLoader, Button, Empty } from "./components/ui";
import { paths } from "./lib/routes";
import { Seo } from "./lib/seo";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import Salon from "./pages/Salon";
import Partners from "./pages/partners/Partners";

// Public, indexable pages are in the main bundle so they can be prerendered.
// Everything behind an action (booking, account, owner tools) loads on demand.
const Book = lazy(() => import("./pages/Book"));
const Booking = lazy(() => import("./pages/Booking"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Setup = lazy(() => import("./pages/partners/Setup"));
const Dashboard = lazy(() => import("./pages/partners/Dashboard"));

/** Start each page at the top, or at the #anchor when the link carries one. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }));
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

/** Old URLs (/salon/:id, /explore) keep working and land on the canonical route. */
function LegacySalon({ book }: { book?: boolean }) {
  const { id } = useParams();
  const { search } = useLocation();
  return <Navigate replace to={`${paths.salons}/${id}${book ? "/book" : ""}${search}`} />;
}
function LegacyExplore() {
  const { search } = useLocation();
  return <Navigate replace to={`${paths.salons}${search}`} />;
}

export function NotFound() {
  return (
    <div className="shell py-24">
      <Seo title="Page not found" description="This page doesn’t exist." path="/404" noindex />
      <Empty title="This page has wandered off" body="The link may be broken, or the page may have moved." action={<Button to={paths.salons}>Browse salons</Button>} />
    </div>
  );
}

const Loading = () => (
  <div className="grid min-h-[70vh] place-items-center text-ink" aria-busy="true">
    <ArchLoader className="h-12" />
  </div>
);

export default function App() {
  return (
    <>
      <ScrollManager />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="salons" element={<Explore />} />
            <Route path="salons/:id" element={<Salon />} />
            <Route path="booking/:id" element={<Booking />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="partners" element={<Partners />} />
            <Route path="explore" element={<LegacyExplore />} />
            <Route path="salon/:id" element={<LegacySalon />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          {/* Focused flows get their own chrome */}
          <Route path="salons/:id/book" element={<Book />} />
          <Route path="salon/:id/book" element={<LegacySalon book />} />
          <Route path="partners/setup" element={<Setup />} />
          <Route path="partners/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </>
  );
}
