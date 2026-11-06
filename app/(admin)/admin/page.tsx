import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const username = session?.user?.githubLogin?.toLowerCase();
  const allowedUsername = process.env.ADMIN_GITHUB_USERNAME?.trim().toLowerCase();
  if (!username || !allowedUsername || username !== allowedUsername) redirect("/login");

  return (
    <AdminDashboard
      username={session?.user?.githubLogin ?? username}
      name={session?.user?.name ?? null}
      avatar={session?.user?.image ?? null}
    />
  );
}
