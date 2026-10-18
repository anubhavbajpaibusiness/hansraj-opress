// lib/keys.js — every Redis key used by this app lives under one namespace,
// so many college sites can safely share ONE Upstash database.
// Each college MUST keep its own namespace (see colleges.csv in the root).

const RAW = process.env.REDIS_NAMESPACE || 'du:hrc:voicebox';
const NS = RAW.replace(/:+$/, '');

export const K = {
  index: () => `${NS}:index`,                 // legacy JSON array (read once, then migrated)
  idx: () => `${NS}:idx`,                     // sorted set of entry ids (score = timestamp)
  migrated: () => `${NS}:idx:migrated`,
  entry: (id) => `${NS}:entry:${id}`,         // one entry, id like HRC-XXXXXX
  session: (token) => `${NS}:session:${token}`,
  loginFail: (ip) => `${NS}:login:fail:${ip}`,
  rate: (ip) => `${NS}:rate:post:${ip}`,
};

export const NAMESPACE = NS;
