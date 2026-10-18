import { redis } from './redis.js';
import { K } from './keys.js';

// Entry ids used to be a single JSON array, which loses submissions when two
// people post at the same moment. They now live in a sorted set (atomic ZADD).
// Old arrays are migrated automatically on first use.
export async function ensureMigrated() {
  if (await redis.get(K.migrated())) return;
  const legacy = await redis.get(K.index());
  if (Array.isArray(legacy) && legacy.length) {
    const n = legacy.length;
    for (let i = 0; i < n; i += 200) {
      const chunk = legacy.slice(i, i + 200).map((id, j) => ({ score: n - (i + j), member: String(id) }));
      await redis.zadd(K.idx(), chunk[0], ...chunk.slice(1));
    }
  }
  await redis.set(K.migrated(), 1);
}

export async function listIds() {
  await ensureMigrated();
  return (await redis.zrange(K.idx(), 0, -1, { rev: true })) || [];
}
export async function addId(id, score) {
  await ensureMigrated();
  await redis.zadd(K.idx(), { score, member: id });
}
export async function removeId(id) {
  await ensureMigrated();
  await redis.zrem(K.idx(), id);
}
