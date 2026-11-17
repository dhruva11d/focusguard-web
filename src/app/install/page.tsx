import type { Metadata } from "next";
import { InstallScreen } from "@/features/install/install-screen";

export const metadata: Metadata = {
  title: "Install FocusGuard",
  description: "Add FocusGuard to your home screen. No sign-in needed to install.",
};

export default function InstallPage() {
  return <InstallScreen />;
}
