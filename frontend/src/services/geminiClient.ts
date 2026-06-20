/**
 * Browser-native Gemini API client.
 * Calls Google Gemini 2.0 Flash directly from the browser — no backend needed.
 */
import { RawTicket, AnalyzedTicket, SeverityLevel, DashboardStats } from '../types/ticket';
import { CategoryConfig } from '../types/category';
import { detectAndCluster } from './duplicateDetector';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
const BATCH_SIZE = 5;          // keep well within free-tier RPM
const BATCH_DELAY_MS = 5000;   // 5s between batches

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function buildPrompt(tickets: RawTicket[], categoryConfig: CategoryConfig): string {
  let categoryInstructions = '';
  if (categoryConfig.columns.length > 0) {
    const colDesc = categoryConfig.columns.map((col) => {
      const vals = col.possible_values.map((v) => `"${v}"`).join(', ');
      return `  - "${col.column_name}": Detect which of [${vals}] is referenced. Return the exact matching value or null.`;
    }).join('\n');
    categoryInstructions = `\n\nFor each ticket, populate a "categories" object:\n${colDesc}`;
  }

  const ticketsJson = JSON.stringify(
    tickets.map((t) => ({
      ticket_id: t.ticket_id,
      text: t.raw_text.slice(0, 3000),
    })),
    null,
    2
  );

  return `You are an expert IT support analyst. Analyze the following support tickets and return ONLY a JSON object.

## Severity Definitions
- Critical: System down, data loss, complete business stoppage, security breach
- High: Major functionality broken, many users affected, no workaround
- Medium: Partial functionality broken, some users affected, workaround exists
- Low: Minor issue, cosmetic problem, single user affected, easy workaround

## Field Definitions
- issue_summary: Single-sentence title (max 120 chars)
- detailed_issue: 2-4 sentence comprehensive description
- rca: Root Cause Analysis — technical root cause or "Insufficient information"
- reason_of_issue: Business/operational reason for the issue
- severity: Exactly one of "Critical", "High", "Medium", "Low"
- recommended_action: Specific actionable next steps for the support team
- confidence_score: Float 0.0–1.0${categoryInstructions}

## Required Output Format
{
  "results": [
    {
      "ticket_id": "<exact ticket_id>",
      "issue_summary": "<string>",
      "detailed_issue": "<string>",
      "rca": "<string>",
      "reason_of_issue": "<string>",
      "severity": "<Critical|High|Medium|Low>",
      "recommended_action": "<string>",
      "confidence_score": <float>,
      "categories": {}
    }
  ]
}

## Input Tickets
${ticketsJson}

## Critical Rules
1. Output ONLY valid JSON. No markdown. No text before/after.
2. Every ticket_id from input MUST appear in output.
3. severity MUST be exactly one of: Critical, High, Medium, Low
4. confidence_score MUST be a number between 0.0 and 1.0
5. If a field cannot be determined, use "Insufficient information"
6. For categories, use ONLY the exact values provided`;
}

function errorTicket(ticket: RawTicket, error: string): AnalyzedTicket {
  return {
    ticket_id: ticket.ticket_id,
    issue_summary: 'Processing Failed',
    detailed_issue: error,
    rca: 'Insufficient information',
    reason_of_issue: 'Insufficient information',
    severity: 'Medium',
    recommended_action: 'Please retry or review manually',
    confidence_score: 0,
    categories: {},
    processing_status: 'error',
    error_message: error,
  };
}

async function analyzeChunk(
  tickets: RawTicket[],
  categoryConfig: CategoryConfig,
  attempt = 0
): Promise<AnalyzedTicket[]> {
  const prompt = buildPrompt(tickets, categoryConfig);

  let response: Response;
  try {
    response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch (err) {
    if (attempt < 3) {
      await sleep(1000 * Math.pow(2, attempt));
      return analyzeChunk(tickets, categoryConfig, attempt + 1);
    }
    return tickets.map((t) => errorTicket(t, 'Network error: ' + (err as Error).message));
  }

  if (response.status === 429) {
    if (attempt < 3) {
      // Aggressive backoff for rate-limit: 15s, 30s, 60s
      const wait = 15000 * Math.pow(2, attempt);
      console.warn(`[Gemini] 429 rate-limited. Retrying in ${wait / 1000}s (attempt ${attempt + 1}/3)…`);
      await sleep(wait);
      return analyzeChunk(tickets, categoryConfig, attempt + 1);
    }
    return tickets.map((t) => errorTicket(t, 'Rate limit exceeded after 3 retries. Please wait a moment and try again.'));
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    return tickets.map((t) => errorTicket(t, `Gemini API error ${response.status}: ${errText}`));
  }

  const data = await response.json();
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  let parsed: { results: Record<string, unknown>[] };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return tickets.map((t) => errorTicket(t, 'Gemini returned invalid JSON'));
  }

  const resultsMap = new Map(
    (parsed.results ?? []).map((item) => [item['ticket_id'] as string, item])
  );

  return tickets.map((ticket) => {
    const item = resultsMap.get(ticket.ticket_id);
    if (!item) return errorTicket(ticket, 'Missing in Gemini response');
    try {
      const severity = item['severity'] as string;
      const validSeverities: SeverityLevel[] = ['Critical', 'High', 'Medium', 'Low'];
      return {
        ticket_id: ticket.ticket_id,
        issue_summary: String(item['issue_summary'] ?? 'Insufficient information'),
        detailed_issue: String(item['detailed_issue'] ?? 'Insufficient information'),
        rca: String(item['rca'] ?? 'Insufficient information'),
        reason_of_issue: String(item['reason_of_issue'] ?? 'Insufficient information'),
        severity: (validSeverities.includes(severity as SeverityLevel)
          ? severity
          : 'Medium') as SeverityLevel,
        recommended_action: String(item['recommended_action'] ?? 'Insufficient information'),
        confidence_score: Math.min(1, Math.max(0, Number(item['confidence_score'] ?? 0.5))),
        categories: (item['categories'] as Record<string, string>) ?? {},
        processing_status: 'success',
      } satisfies AnalyzedTicket;
    } catch (e) {
      return errorTicket(ticket, String(e));
    }
  });
}

function computeStats(
  tickets: AnalyzedTicket[],
  clusters: ReturnType<typeof detectAndCluster>['clusters']
): DashboardStats {
  const severityDist: Record<SeverityLevel, number> = {
    Critical: 0, High: 0, Medium: 0, Low: 0,
  };
  const categoryDist: Record<string, Record<string, number>> = {};

  for (const t of tickets) {
    if (t.severity in severityDist) severityDist[t.severity]++;
    for (const [key, val] of Object.entries(t.categories ?? {})) {
      if (!val) continue;
      if (!categoryDist[key]) categoryDist[key] = {};
      categoryDist[key][val] = (categoryDist[key][val] ?? 0) + 1;
    }
  }

  const topRecurring = clusters
    .filter((c) => c.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((c) => ({ cluster_id: c.cluster_id, summary: c.representative_summary, count: c.count }));

  return {
    total_tickets: tickets.length,
    unique_issues: clusters.length,
    top_recurring_issues: topRecurring,
    severity_distribution: severityDist,
    category_distribution: categoryDist,
  };
}

/** Main analysis entry point — fully browser-native */
export async function analyzeBatch(
  tickets: RawTicket[],
  categoryConfig: CategoryConfig,
  onProgress?: (current: number, total: number) => void
): Promise<{
  tickets: AnalyzedTicket[];
  clusters: ReturnType<typeof detectAndCluster>['clusters'];
  stats: DashboardStats;
  processing_summary: { success: number; error: number; partial: number };
}> {
  const allAnalyzed: AnalyzedTicket[] = [];
  const total = tickets.length;
  let processed = 0;

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < tickets.length; i += BATCH_SIZE) {
    const chunk = tickets.slice(i, i + BATCH_SIZE);
    const results = await analyzeChunk(chunk, categoryConfig);
    allAnalyzed.push(...results);
    processed += chunk.length;
    onProgress?.(processed, total);
    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < tickets.length) await sleep(BATCH_DELAY_MS);
  }

  // Cluster
  const { tickets: clusteredTickets, clusters } = detectAndCluster(allAnalyzed);

  // Stats
  const stats = computeStats(clusteredTickets, clusters);

  const successCount = clusteredTickets.filter((t) => t.processing_status === 'success').length;
  const errorCount = clusteredTickets.filter((t) => t.processing_status === 'error').length;

  return {
    tickets: clusteredTickets,
    clusters,
    stats,
    processing_summary: { success: successCount, error: errorCount, partial: 0 },
  };
}
