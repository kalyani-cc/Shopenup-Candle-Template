import { CartClient } from "@/components/pages/cart-client";

type CartPageProps = {
  searchParams?: {
    addVariant?: string;
  };
};

export default function CartPage({ searchParams }: CartPageProps) {
  const initialAddVariant = searchParams?.addVariant || null;
  return <CartClient initialAddVariant={initialAddVariant} />;
}
