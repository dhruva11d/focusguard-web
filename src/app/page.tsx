import { redirect } from "next/navigation";
import { getCurrentAccountServer } from "@/lib/backend/server";

export default async function Home() {
  const account = await getCurrentAccountServer();
  if (account) redirect("/workshop");
  redirect("/sign-in");
}
