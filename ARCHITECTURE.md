# Modular Verification Architecture Plan

## Current Problem

Every layer is hardcoded to the TIN/business-license flow:

| Layer | Current | Problem |
|-------|---------|---------|
| `ParsedQrData` | `{ source, type, licenseNo, tin }` | Fixed fields — can't carry PDF data, other doc types |
| `parser.service.ts` | Expects `licenseNo` & `tin` query params | Can only parse etrade URLs |
| `GovernmentIntegration` | `verifyBusinessLicense(licenseNo, tin)` | Interface too specific |
| `LicenseVerificationResult` | `{ valid, tin, businessName, licenseStatus, phone }` | TIN-specific fields |
| `VerificationSession` model | Schema has `tin`, `licenseNo` | Rigid schema |
| `verification.service.ts` | `processQrScan` uses `parsed.tin`, `parsed.licenseNo` | Only works for one document type |

## Proposed Architecture

```
src/
├── core/                              NEW: abstract, document-type-agnostic
│   ├── types.ts                       ExtractedData, VerificationResult, DocumentVerifier
│   └── scanner.service.ts             (moved from qr-verification/scanner)
│
├── integrations/                      UPDATED: verifiers are self-contained modules
│   ├── registry.ts                    Generic registry: sourceId → DocumentVerifier
│   │
│   ├── etrade/                        Current etrade (refactored interface)
│   │   ├── types.ts
│   │   ├── client.ts
│   │   ├── verifier.ts               Implements DocumentVerifier
│   │   └── index.ts
│   │
│   └── future-source/                 Future: PDF, other websites, etc.
│       ├── types.ts
│       ├── client.ts
│       ├── verifier.ts
│       └── index.ts
│
├── parser/                            UPDATED: multiple parsers, dispatcher
│   ├── registry.ts                    Maps source/patterns → parsers
│   ├── etrade.parser.ts               Current etrade URL parsing logic
│   └── parser.service.ts              Dispatches to correct parser
│
├── models/                            UPDATED: flexible schema
│   ├── types.ts                       Generic fields container
│   ├── verification-session.model.ts
│   └── audit-log.model.ts
│
├── services/
│   └── verification.service.ts        UPDATED: works with any document type
│
├── controllers/                       MINIMAL CHANGE
│   └── routes.ts
│
└── otp/                               UNCHANGED (for future)
```

## Key Abstractions

### `core/types.ts` — Generic, not TIN-specific

```ts
interface ExtractedData {
  source: string;           // e.g. "etrade.gov.et", "manual-upload"
  documentType: string;     // e.g. "business_license", "tax_clearance"
  fields: Record<string, string>;  // any key-value pairs
  raw?: { url?: string; file?: Buffer };
}

interface VerificationResult {
  valid: boolean;
  documentType: string;
  status: string;
  fields: Record<string, string>;
  failureReason?: string;
}

interface DocumentVerifier {
  readonly sourceId: string;
  canHandle(data: ExtractedData): boolean;
  verify(data: ExtractedData): Promise<VerificationResult>;
}
```

### `parser/etrade.parser.ts` — Extracted from current `parser.service.ts`

Moves the etrade-specific URL parsing (`licenseNo`, `tin` extraction) into its own file. The parser registry maps `etrade.gov.et` to this parser.

### `integrations/etrade/verifier.ts` — Refactored `EtradeService`

Still calls `getBusinessByLicenseNo()` internally, but implements `DocumentVerifier` and maps the API response into generic `fields`.

## How to Add a New Document Type

```
1. Create integrations/new-source/verifier.ts implementing DocumentVerifier
2. Create a parser for the input format if needed
3. Register both in their registries
4. Zero changes to: verification.service.ts, models, controllers, routes
```

## Migration Path

| Step | Change | Impact |
|------|--------|--------|
| 1 | Create `core/types.ts` + `core/scanner.service.ts` | New files, no breakage |
| 2 | Extract `parser/etrade.parser.ts`, update `parser.service.ts` to dispatch | Existing import paths unchanged |
| 3 | Update `integrations/verifier.interface.ts` to `DocumentVerifier` | Breaks `EtradeService` — update next |
| 4 | Refactor `EtradeService` → `verifier.ts` implementing `DocumentVerifier` | Internal change only |
| 5 | Update `IVerificationSession` model — add generic `fields` map | Backward-compatible (keep `tin`, `licenseNo` for now) |
| 6 | Update `verification.service.ts` to use generic flow | No external API change |
| 7 | Remove old `qr-verification/` directory | Final cleanup |

## What Stays the Same

- `etrade.client.ts` and all eTrade API logic — unchanged
- HTTP routes and middleware — unchanged
- OTP service — unchanged (re-enabled later)
- Validators — unchanged
- Existing API response format — unchanged (for backward compat)
