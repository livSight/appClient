import { Image } from "react-native";

export type TransactionImagePart = {
  uri: string;
  name: string;
  type: string;
};

/** 1×1 PNG bundled for POST /api/transactions when the UI has no photo yet. */
export function getDefaultTransactionImagePart(): TransactionImagePart {
  const resolved = Image.resolveAssetSource(
    require("@/assets/images/placeholder-transaction.png"),
  );
  return {
    uri: resolved.uri,
    name: "placeholder-transaction.png",
    type: "image/png",
  };
}
