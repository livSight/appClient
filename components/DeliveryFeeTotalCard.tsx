import { View } from "react-native";
import AppText from "./AppText";
import { formatTariffAmountLabel } from "@/lib/api/tariffUi";
import type { DeliveryFeeEstimate } from "@/lib/deliveryFeeEstimate";
import { colors, fonts } from "../theme/tokens";

type Props = {
  estimate: DeliveryFeeEstimate;
  loading?: boolean;
};

function FeeRow({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.85)" }} numberOfLines={2}>
        {label}
      </AppText>
      <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={1}>
        {formatTariffAmountLabel(amount)}
      </AppText>
    </View>
  );
}

export default function DeliveryFeeTotalCard({ estimate, loading = false }: Props) {
  return (
    <View style={{ gap: 10 }}>
      {loading ? (
        <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "rgba(60,74,60,0.65)" }} numberOfLines={2}>
          Chargement des tarifs…
        </AppText>
      ) : estimate.available && estimate.total != null ? (
        <>
          {estimate.zoneDeliveryFee != null ? <FeeRow label="Frais de livraison (zone)" amount={estimate.zoneDeliveryFee} /> : null}
          {estimate.neighborhoodEntryFee != null ? (
            <FeeRow label="Frais de quartier" amount={estimate.neighborhoodEntryFee} />
          ) : null}
          {estimate.expressSupplement != null ? <FeeRow label="Supplément express" amount={estimate.expressSupplement} /> : null}
          <View style={{ height: 1, backgroundColor: "#EDEEEF", marginTop: 2 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 2 }}>
            <AppText style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
              Total estimé
            </AppText>
            <AppText style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
              {formatTariffAmountLabel(estimate.total)}
            </AppText>
          </View>
        </>
      ) : (
        <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "rgba(60,74,60,0.65)" }} numberOfLines={3}>
          {estimate.pendingMessage}
        </AppText>
      )}
    </View>
  );
}
