import { TourProvider } from '@/components/GuidedTour';

/**
 * The tour provider sits here and not inside a page, so a tour can walk from the apiary list to
 * an apiary to a colony without losing its place (#449).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <TourProvider>{children}</TourProvider>;
}
