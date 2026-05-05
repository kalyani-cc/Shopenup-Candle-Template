import { redirect } from "next/navigation";

type ProductAliasProps = {
  params: {
    id: string;
  };
};

export default function ProductAliasPage({ params }: ProductAliasProps) {
  redirect(`/products/${params.id}`);
}
