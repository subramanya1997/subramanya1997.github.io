// Ranking for the server-side search endpoint (app/api/search/). Pure and
// synchronous: it works over the prebuilt section index and touches no files.
//
// Matching is word-aware — a whole word beats a word prefix, which beats a
// mid-word substring — and a query word that occurs nowhere on the site is
// replaced by its closest spellings from the site's own vocabulary.
import type { SearchDoc } from "./nonhtml";

export interface SearchHit {
  /** "page" links to the document; "section" deep-links to one heading. */
  type: "page" | "section";
  kind: SearchDoc["kind"];
  /** Document title. */
  title: string;
  /** Section heading (type "section" only). */
  heading?: string;
  url: string;
  /** Text around the match; empty when only the title/heading matched. */
  snippet: string;
  date: string | null;
  tags: string[];
}

export interface SearchResponse {
  query: string;
  /** Words to highlight: the query words, or the spellings that replaced them. */
  terms: string[];
  /** The query as it was actually searched, when a word was respelled. */
  corrected: string | null;
  /** Documents that matched (results may show fewer). */
  total: number;
  results: SearchHit[];
}

interface PreparedSection {
  heading: string;
  text: string;
}

interface PreparedDoc {
  doc: SearchDoc;
  title: string;
  tags: string;
  excerpt: string;
  sections: PreparedSection[];
}

interface Engine {
  docs: PreparedDoc[];
  /** Every searchable string joined, for a cheap "does this occur at all". */
  haystack: string;
  vocabulary: Map<string, number>;
  recent: SearchHit[];
}

const MAX_RESULTS = 12;
const MAX_QUERY_LENGTH = 120;
const MAX_TOKENS = 8;
const RECENT_COUNT = 5;
const SNIPPET_LENGTH = 150;
const FUZZY_FACTOR = 0.6;

// Indexed by match level: none, substring, word prefix, whole word.
const WEIGHTS = {
  title: [0, 40, 70, 100],
  heading: [0, 25, 45, 60],
  tags: [0, 20, 35, 50],
  excerpt: [0, 8, 14, 20],
  body: [0, 4, 7, 10],
} as const;

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isWordChar(code: number): boolean {
  return (
    (code >= 97 && code <= 122) || // a-z
    (code >= 48 && code <= 57) || // 0-9
    code > 127
  );
}

/** 3 = whole word, 2 = word prefix, 1 = inside a word, 0 = absent. */
function matchLevel(text: string, token: string): number {
  let best = 0;
  let scanned = 0;
  for (let at = text.indexOf(token); at !== -1 && scanned < 40; at = text.indexOf(token, at + 1)) {
    scanned++;
    if (at === 0 || !isWordChar(text.charCodeAt(at - 1))) {
      const end = at + token.length;
      if (end >= text.length || !isWordChar(text.charCodeAt(end))) return 3;
      best = 2;
    } else if (best === 0) {
      best = 1;
    }
  }
  return best;
}

function bestLevel(text: string, alternatives: string[]): number {
  let best = 0;
  for (const token of alternatives) {
    best = Math.max(best, matchLevel(text, token));
    if (best === 3) break;
  }
  return best;
}

/** Damerau-Levenshtein distance, or `limit + 1` once it exceeds `limit`. */
function editDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous2: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, previous2[j - 2] + 1);
      }
      current[j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > limit) return limit + 1;
    previous2 = previous;
    previous = current;
  }
  return previous[b.length];
}

function closestWords(token: string, vocabulary: Map<string, number>): string[] {
  const limit = token.length >= 8 ? 2 : 1;
  const candidates: { word: string; distance: number; count: number }[] = [];
  for (const [word, count] of vocabulary) {
    const distance = editDistance(token, word, limit);
    if (distance <= limit) candidates.push({ word, distance, count });
  }
  candidates.sort((a, b) => a.distance - b.distance || b.count - a.count);
  return candidates.slice(0, 3).map((candidate) => candidate.word);
}

/** The window of `text` that covers the most distinct terms. */
function snippet(text: string, terms: string[]): string {
  const lower = text.toLowerCase();
  const hits: { at: number; term: number }[] = [];
  terms.forEach((term, index) => {
    let found = 0;
    for (let at = lower.indexOf(term); at !== -1 && found < 12; at = lower.indexOf(term, at + 1)) {
      hits.push({ at, term: index });
      found++;
    }
  });
  if (!hits.length) return "";
  hits.sort((a, b) => a.at - b.at);

  let bestStart = hits[0].at;
  let bestCover = 0;
  for (let i = 0; i < hits.length; i++) {
    const seen = new Set<number>();
    for (let j = i; j < hits.length && hits[j].at - hits[i].at < SNIPPET_LENGTH - 50; j++) {
      seen.add(hits[j].term);
    }
    if (seen.size > bestCover) {
      bestCover = seen.size;
      bestStart = hits[i].at;
    }
  }

  let start = Math.max(0, bestStart - 40);
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space !== -1 && space < bestStart) start = space + 1;
  }
  const end = Math.min(text.length, start + SNIPPET_LENGTH);
  return (start > 0 ? "… " : "") + text.slice(start, end).trim() + (end < text.length ? " …" : "");
}

function lead(text: string): string {
  if (text.length <= SNIPPET_LENGTH) return text;
  return `${text.slice(0, SNIPPET_LENGTH).trim()} …`;
}

function hit(doc: SearchDoc, partial: Pick<SearchHit, "type" | "url" | "snippet" | "heading">): SearchHit {
  return {
    kind: doc.kind,
    title: doc.title,
    date: doc.date_display,
    tags: doc.tags.slice(0, 3),
    ...partial,
  };
}

export function createEngine(index: SearchDoc[]): Engine {
  const vocabulary = new Map<string, number>();
  const parts: string[] = [];
  const docs = index.map((doc) => {
    const prepared: PreparedDoc = {
      doc,
      title: normalize(doc.title),
      tags: normalize(doc.tags.join(" · ")),
      excerpt: normalize(doc.excerpt),
      sections: doc.sections.map((section) => ({
        heading: normalize(section.heading),
        text: section.text.toLowerCase(),
      })),
    };
    parts.push(prepared.title, prepared.tags, prepared.excerpt);
    for (const section of prepared.sections) parts.push(section.heading, section.text);
    return prepared;
  });
  const haystack = parts.join("\n");
  for (const word of haystack.match(/[\p{L}\p{N}]{4,}/gu) ?? []) {
    vocabulary.set(word, (vocabulary.get(word) ?? 0) + 1);
  }

  const recent = index
    .filter((doc) => doc.kind === "post")
    .sort((a, b) => String(b.date_iso ?? "").localeCompare(String(a.date_iso ?? "")))
    .slice(0, RECENT_COUNT)
    .map((doc) => hit(doc, { type: "page", url: doc.url, snippet: "" }));

  return { docs, haystack, vocabulary, recent };
}

export function search(engine: Engine, rawQuery: string): SearchResponse {
  const query = normalize(rawQuery.slice(0, MAX_QUERY_LENGTH));
  const tokens = query.split(" ").filter(Boolean).slice(0, MAX_TOKENS);
  if (!tokens.length) {
    return { query: "", terms: [], corrected: null, total: engine.recent.length, results: engine.recent };
  }

  // Each query word becomes the spellings to look for: itself, or — when it
  // occurs nowhere on the site — its nearest neighbours in the vocabulary.
  let respelled = false;
  const wanted = tokens.map((token) => {
    if (engine.haystack.includes(token) || token.length < 4) {
      return { alternatives: [token], factor: 1 };
    }
    const alternatives = closestWords(token, engine.vocabulary);
    if (alternatives.length) respelled = true;
    return { alternatives, factor: FUZZY_FACTOR };
  });
  const terms = wanted.flatMap((entry) => entry.alternatives);
  const empty: SearchResponse = { query, terms, corrected: null, total: 0, results: [] };
  if (wanted.some((entry) => !entry.alternatives.length)) return empty;

  const phrase = wanted.every((entry) => entry.factor === 1) && tokens.length > 1 ? query : null;
  const ranked: { score: number; iso: string; hit: SearchHit }[] = [];
  let total = 0;

  for (const prepared of engine.docs) {
    const { doc, sections } = prepared;
    const sectionScores = new Array<number>(sections.length).fill(0);
    const sectionCover = new Array<number>(sections.length).fill(0);
    const headingMatch = new Array<boolean>(sections.length).fill(false);
    let metaScore = 0;
    let bodyScore = 0;
    let bestSection = -1;
    let bestSectionScore = 0;
    let matched = true;

    for (const { alternatives, factor } of wanted) {
      const meta =
        (WEIGHTS.title[bestLevel(prepared.title, alternatives)] +
          WEIGHTS.tags[bestLevel(prepared.tags, alternatives)] +
          WEIGHTS.excerpt[bestLevel(prepared.excerpt, alternatives)]) *
        factor;
      let bestBody = 0;
      sections.forEach((section, index) => {
        const headingLevel = bestLevel(section.heading, alternatives);
        const value =
          (WEIGHTS.heading[headingLevel] + WEIGHTS.body[bestLevel(section.text, alternatives)]) *
          factor;
        if (value > 0) {
          sectionScores[index] += value;
          sectionCover[index]++;
          if (headingLevel > 0) headingMatch[index] = true;
          bestBody = Math.max(bestBody, value);
        }
      });
      if (meta === 0 && bestBody === 0) {
        matched = false;
        break;
      }
      metaScore += meta;
      bodyScore += bestBody;
    }
    if (!matched) continue;
    total++;

    if (phrase) {
      if (prepared.title.includes(phrase)) metaScore += 80;
      else if (prepared.excerpt.includes(phrase)) metaScore += 15;
      sections.forEach((section, index) => {
        if (section.heading.includes(phrase)) sectionScores[index] += 50;
        else if (section.text.includes(phrase)) sectionScores[index] += 15;
      });
    }
    sections.forEach((_, index) => {
      if (sectionScores[index] > bestSectionScore) {
        bestSectionScore = sectionScores[index];
        bestSection = index;
      }
    });

    // Sections that satisfy the whole query on their own get their own row.
    const deepLinks = sections
      .map((section, index) => ({ index, score: sectionScores[index] }))
      .filter(
        ({ index }) =>
          doc.sections[index].id !== "" && sectionCover[index] === wanted.length,
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    const iso = String(doc.date_iso ?? "");
    if (metaScore > 0 || !deepLinks.length) {
      const fromExcerpt = snippet(doc.excerpt, terms);
      const fromBody = bestSection >= 0 ? snippet(doc.sections[bestSection].text, terms) : "";
      ranked.push({
        score: metaScore + bodyScore * 0.5,
        iso,
        hit: hit(doc, {
          type: "page",
          url: doc.url,
          snippet: fromExcerpt || fromBody || lead(doc.excerpt),
        }),
      });
    }
    for (const { index, score } of deepLinks) {
      const section = doc.sections[index];
      // A body-only mention under a page that already ranks adds little.
      if (metaScore > 0 && !headingMatch[index] && deepLinks.length > 1 && index !== deepLinks[0].index) {
        continue;
      }
      ranked.push({
        score,
        iso,
        hit: hit(doc, {
          type: "section",
          url: `${doc.url}#${section.id}`,
          heading: section.heading,
          snippet: snippet(section.text, terms) || lead(section.text),
        }),
      });
    }
  }

  ranked.sort((a, b) => b.score - a.score || b.iso.localeCompare(a.iso));
  return {
    query,
    terms,
    corrected: respelled ? wanted.map((entry) => entry.alternatives[0]).join(" ") : null,
    total,
    results: ranked.slice(0, MAX_RESULTS).map((entry) => entry.hit),
  };
}
