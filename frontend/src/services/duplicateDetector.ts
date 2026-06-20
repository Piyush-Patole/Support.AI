/**
 * Browser-native duplicate detection & clustering.
 * Implements TF-IDF cosine similarity + Union-Find — no backend needed.
 */
import { AnalyzedTicket, IssueCluster } from '../types/ticket';

const STOPWORDS = new Set([
  'a','an','the','is','it','in','on','at','to','for','of','and','or','but',
  'with','this','that','was','are','be','has','have','had','not','from',
  'by','we','our','they','their','i','my','you','your','as','can','will',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const total = tokens.length || 1;
  tf.forEach((v, k) => tf.set(k, v / total));
  return tf;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, normA = 0, normB = 0;
  a.forEach((va, k) => {
    dot += va * (b.get(k) ?? 0);
    normA += va * va;
  });
  b.forEach((vb) => { normB += vb * vb; });
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// Union-Find
class UnionFind {
  private parent: number[];
  constructor(n: number) { this.parent = Array.from({ length: n }, (_, i) => i); }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(x: number, y: number) {
    const px = this.find(x), py = this.find(y);
    if (px !== py) this.parent[px] = py;
  }
}

function shortHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return 'CLU-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

export function detectAndCluster(
  tickets: AnalyzedTicket[]
): { tickets: AnalyzedTicket[]; clusters: IssueCluster[] } {
  if (tickets.length === 0) return { tickets, clusters: [] };

  if (tickets.length === 1) {
    tickets[0].cluster_id = shortHash(tickets[0].issue_summary);
    return {
      tickets,
      clusters: [{
        cluster_id: tickets[0].cluster_id!,
        representative_summary: tickets[0].issue_summary,
        ticket_ids: [tickets[0].ticket_id],
        count: 1,
      }],
    };
  }

  // Build TF-IDF vectors
  const tokenSets = tickets.map((t) => tokenize(t.issue_summary + ' ' + t.rca));
  const tfVectors = tokenSets.map((tokens) => termFrequency(tokens));

  // Compute IDF
  const allTerms = new Set(tokenSets.flat());
  const idf = new Map<string, number>();
  allTerms.forEach((term) => {
    const docCount = tfVectors.filter((tf) => tf.has(term)).length;
    idf.set(term, Math.log((tickets.length + 1) / (docCount + 1)) + 1);
  });

  // Apply IDF
  const tfidfVectors = tfVectors.map((tf) => {
    const tfidf = new Map<string, number>();
    tf.forEach((v, k) => tfidf.set(k, v * (idf.get(k) ?? 1)));
    return tfidf;
  });

  // Cluster via union-find at threshold 0.72
  const uf = new UnionFind(tickets.length);
  const THRESHOLD = 0.72;

  for (let i = 0; i < tickets.length; i++) {
    for (let j = i + 1; j < tickets.length; j++) {
      const sim = cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
      if (sim >= THRESHOLD) uf.union(i, j);
    }
  }

  // Group by root
  const groups = new Map<number, number[]>();
  for (let i = 0; i < tickets.length; i++) {
    const root = uf.find(i);
    const grp = groups.get(root) ?? [];
    grp.push(i);
    groups.set(root, grp);
  }

  const clusterList: IssueCluster[] = [];

  groups.forEach((indices) => {
    const rep = tickets[indices[0]];
    const clusterId = shortHash(rep.issue_summary);
    indices.forEach((i) => { tickets[i].cluster_id = clusterId; });
    clusterList.push({
      cluster_id: clusterId,
      representative_summary: rep.issue_summary,
      ticket_ids: indices.map((i) => tickets[i].ticket_id),
      count: indices.length,
    });
  });

  return { tickets, clusters: clusterList };
}
