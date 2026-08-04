import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register | FoodDelivery",
  description: "Create a FoodDelivery account.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
