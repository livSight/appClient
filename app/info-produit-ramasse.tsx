import { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";

export default function InfoProduitRamasseRedirect() {
  const { quartier } = useLocalSearchParams<{ quartier?: string }>();

  useEffect(() => {
    router.replace({
      pathname: "/ma-demande-livraison",
      params: { quartier: typeof quartier === "string" ? quartier : "", mode: "pickup" },
    });
  }, [quartier]);

  return null;
}
