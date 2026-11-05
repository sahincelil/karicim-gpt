# OBSIDIAN Global IPFS-MCP Gateway

This directory contains a lightweight Cloudflare Worker that exposes a small MCP JSON-RPC endpoint over HTTPS. It is designed as a remote control-plane entry point; the user's PC is not used for model inference or worker compute.

## Included tools

- `ipfs_network_info`
- `ipfs_cid_validate`
- `ipfs_fetch`

The gateway is fixed to `https://ipfs.io`. Fetching is read-only and capped at 1 MiB with a 12-second timeout. The MCP endpoint requires a bearer token stored as a Cloudflare Worker secret named `MESH_TOKEN`. The health endpoint is public and returns no sensitive information.

## Local checks

```sh
node --check worker.js
```

## Deploy (requires the repository owner to authenticate Cloudflare)

1. Install Wrangler in a trusted development environment.
2. Run `npx wrangler secret put MESH_TOKEN` and enter a newly generated high-entropy token in the terminal. Never commit it or paste it into chat.
3. Run `npx wrangler deploy`.
4. Verify `GET /health`.
5. Configure the MCP client with the deployed `/mcp` endpoint and an Authorization bearer header using the same secret.

No deployment is performed by this repository change.

## Important limitations

IPFS is a content-addressed distribution layer, not a compute scheduler. This Worker is a remote MCP gateway, not a decentralized peer mesh. It does not publish or pin data, execute code, connect to Kubo RPC, or run AI models. A true distributed worker network still needs libp2p peer discovery, authenticated peer identities, signed task envelopes, explicit worker opt-in, sandboxed execution, quotas, replay protection, and result verification.

Only publish public, non-sensitive artifacts to IPFS. Do not upload credentials, personal data, private project files, or unencrypted secrets.
