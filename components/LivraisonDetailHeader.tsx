import { View } from "react-native";
import CenteredScreenHeader from "./CenteredScreenHeader";

type Props = {
  referenceLabel?: string | null;
};

export default function LivraisonDetailHeader({ referenceLabel }: Props) {
  const ref = referenceLabel?.trim() ?? "";
  const title = ref.length ? `REF: ${ref}` : "Livraison";
  return (
    <View style={{ marginBottom: 12 }}>
      <CenteredScreenHeader
        title={title}
        subtitle={null}
        showBack
      />
    </View>
  );
}

