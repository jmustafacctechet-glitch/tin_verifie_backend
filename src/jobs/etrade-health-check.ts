import https from 'https';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const CERT_ERROR_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
]);

// Known-good TIN we can always test against (set via ETRADE_HEALTH_CHECK_TIN env var)
const TEST_TIN = process.env.ETRADE_HEALTH_CHECK_TIN;
const TEST_URL = `https://etrade.gov.et/api/Registration/GetRegistrationInfoByTin/${TEST_TIN}/am`;

export async function checkEtradeHealth(): Promise<{
  healthy: boolean;
  reason?: string;
}> {
  try {
    const certPath = path.resolve(process.cwd(), 'certs/etrade-ca.pem');
    const agent = new https.Agent({ ca: fs.readFileSync(certPath) });

    await axios.get(TEST_URL, {
      httpsAgent: agent,
      headers: {
        Referer: 'https://etrade.gov.et/business-license-checker',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
      },
      timeout: 10000,
    });

    console.log('✅ eTrade health check passed');
    return { healthy: true };

  } catch (err: any) {
    const code = err?.cause?.code ?? err?.code ?? '';
    const isCertError = CERT_ERROR_CODES.has(code);

    if (isCertError) {
      // This is the one you most need to know about immediately
      console.error('🔴 eTrade CERT ROTATION DETECTED — update certs/etrade-ca.pem now');
      console.error('Run: openssl s_client -connect etrade.gov.et:443 -showcerts 2>/dev/null | openssl x509 -outform PEM > certs/etrade-ca.pem');
      return { healthy: false, reason: 'CERT_ROTATED' };
    }

    console.error('⚠️ eTrade health check failed:', code || err.message);
    return { healthy: false, reason: code || 'UNKNOWN' };
  }
}