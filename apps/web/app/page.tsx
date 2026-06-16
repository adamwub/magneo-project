import { redirect } from "next/navigation";
import { getSession, homePathForRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const session = getSession();
  redirect(session ? homePathForRole(session.role) : "/login");
}
