import {
  DashboardHeader,
  OverviewStats,
  RecentActivities,
  UpcomingAgenda,
} from "@/components/admin/dashboard";

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <DashboardHeader />
      <OverviewStats />
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <RecentActivities />
        <UpcomingAgenda />
      </div>
    </main>
  );
}
