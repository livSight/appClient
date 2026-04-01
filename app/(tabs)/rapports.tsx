import { Text } from "react-native";
import ScreenLayout from "../../components/ScreenLayout";
import { typography } from "../../theme/tokens";

export default function RapportsScreen() {
  return (
    <ScreenLayout>
      <Text style={typography.screenTitle}>Rapports</Text>
    </ScreenLayout>
  );
}

