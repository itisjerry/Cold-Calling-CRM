import { redirect } from "next/navigation";
export default function RootPage() {
  // Always land on the login picker; SessionGuard will route signed-in users
  // back to their dashboard from there.
  redirect("/login");
}
