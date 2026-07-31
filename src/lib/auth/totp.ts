import { TOTP } from 'otplib'
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble'
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure'
import { SITE_NAME } from '@/lib/constants'

export const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  issuer: SITE_NAME,
  digits: 6,
  period: 30,
})
