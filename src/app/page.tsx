import { redirect } from "next/navigation";

export default function Home() {
  // Immediately redirect to login to avoid any API calls
  redirect("/login");
}
