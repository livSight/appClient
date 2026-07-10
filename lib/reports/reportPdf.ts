import { buildReportPdfRequest } from "@/lib/api/reports";
import { logger } from "@/lib/logger";

export const PDF_MODULES_UNAVAILABLE_MESSAGE =
  "Le téléchargement de PDF nécessite une version plus récente de l'application.";

/**
 * expo-file-system / expo-sharing are native modules added after the current
 * dev builds were made. Loading them lazily keeps the Rapports screen working
 * on builds that don't ship them yet — only the PDF button fails, with a
 * clear message, until the app is rebuilt.
 */
function loadNativeModules(): {
  FileSystem: typeof import("expo-file-system/legacy");
  Sharing: typeof import("expo-sharing");
} {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const FileSystem = require("expo-file-system/legacy");
    const Sharing = require("expo-sharing");
    /* eslint-enable @typescript-eslint/no-require-imports */
    // On builds made before these packages were added, require() can still
    // succeed while the native side is missing — validate the actual exports.
    if (
      typeof FileSystem?.downloadAsync !== "function" ||
      typeof FileSystem?.cacheDirectory !== "string" ||
      typeof Sharing?.isAvailableAsync !== "function" ||
      typeof Sharing?.shareAsync !== "function"
    ) {
      throw new Error("native exports missing");
    }
    return { FileSystem, Sharing };
  } catch (e: unknown) {
    logger.warn("reports", "native PDF modules unavailable", e);
    throw new Error(PDF_MODULES_UNAVAILABLE_MESSAGE);
  }
}

/**
 * Downloads a report PDF from the backend (authenticated) into the cache
 * directory, then opens the native share/preview sheet.
 */
export async function downloadAndShareReportPdf(
  kind: "deliveries" | "stock",
  startDate: string,
  endDate: string,
): Promise<void> {
  const { FileSystem, Sharing } = loadNativeModules();
  const { url, headers, fileName } = await buildReportPdfRequest(kind, startDate, endDate);
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  logger.info("reports", `download ${kind} PDF`, { url });
  const result = await FileSystem.downloadAsync(url, fileUri, { headers });
  if (result.status !== 200) {
    throw new Error(`HTTP ${result.status}`);
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: "application/pdf",
      dialogTitle: fileName,
      UTI: "com.adobe.pdf",
    });
  } else {
    throw new Error("Le partage de fichiers n'est pas disponible sur cet appareil.");
  }
}
