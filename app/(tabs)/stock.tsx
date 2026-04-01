import { Text } from "react-native";
import ScreenLayout from "../../components/ScreenLayout";
import { typography } from "../../theme/tokens";

export default function StockScreen() {
  return (
    <ScreenLayout>
      <Text style={typography.screenTitle}>Stock</Text>
    </ScreenLayout>
  );
}

