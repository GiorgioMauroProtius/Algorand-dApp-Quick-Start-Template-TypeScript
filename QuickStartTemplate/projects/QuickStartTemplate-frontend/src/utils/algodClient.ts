import algosdk from "algosdk";

let algodClient: algosdk.Algodv2 | null = null;

/**
 * Singleton Algod client (read-only, Track-C compatible)
 */
export function getAlgodClient(): algosdk.Algodv2 {
  if (!algodClient) {
    const server =
      import.meta.env.VITE_ALGOD_SERVER ??
      "https://testnet-api.algonode.cloud";

    const token = import.meta.env.VITE_ALGOD_TOKEN ?? "";

    const port = import.meta.env.VITE_ALGOD_PORT
      ? Number(import.meta.env.VITE_ALGOD_PORT)
      : undefined;

    algodClient = new algosdk.Algodv2(token, server, port);
  }

  return algodClient;
}
