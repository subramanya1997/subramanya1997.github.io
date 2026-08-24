// Typed accessors over content/data/*, plus the derived collections the Liquid
// templates built inline (tag archive directory, per-post view counts).
import {
  getAllBooks,
  getAllPosts,
  getDataFile,
  getSiteConfig,
  slugifyTag,
  type CollectionDoc,
  type Post,
} from "@/lib/content";

export interface AboutExperience {
  position: string;
  company: string;
  location?: string;
  period: string;
  logo?: string;
  description: string;
  achievements?: string[];
}

export interface AboutEducation {
  institution: string;
  location?: string;
  degree: string;
  period: string;
  logo?: string;
  description: string;
  details?: Record<string, string>[];
}

export interface AboutPublication {
  title: string;
  authors: string;
  venue: string;
  year: number | string;
  url: string;
  related_post?: string;
}

export interface About {
  cv_file: string;
  twitter_username: string;
  github_username: string;
  linkedin_username: string;
  scholar_id: string;
  bio: string;
  history: string;
  fav_quote?: string;
  email?: string;
  experience: AboutExperience[];
  education: AboutEducation[];
  publications: AboutPublication[];
}

let _about: About | null = null;
export function getAbout(): About {
  if (!_about) _about = getDataFile<About>("about");
  return _about;
}

export interface ViewCountEntry {
  url: string;
  views: number;
  avg_duration_seconds: number;
  engagement_rate: number;
}
export interface ViewCountData {
  last_updated: string;
  view_counts: ViewCountEntry[];
}

let _views: ViewCountData | null = null;
export function getViewCounts(): ViewCountData {
  if (!_views) _views = getDataFile<ViewCountData>("view_count");
  return _views;
}

export function viewsFor(url: string): number | undefined {
  return getViewCounts().view_counts.find((v) => v.url === url)?.views;
}

/**
 * `_plugins/tag_pages_generator.rb`'s `site.data.tag_archives`: every tag on a
 * post or book, ordered by descending item count then case-insensitive name.
 * Documents are walked oldest-first (Jekyll's `site.posts.docs` order), which
 * is what decides the display casing when a tag is spelled inconsistently.
 */
export interface TagArchive {
  name: string;
  slug: string;
  post_count: number;
  book_count: number;
  total_count: number;
  posts: Post[];
  books: CollectionDoc[];
}

let _tagArchives: TagArchive[] | null = null;
export function getTagArchives(): TagArchive[] {
  if (_tagArchives) return _tagArchives;

  const records = new Map<string, TagArchive>();
  const ensure = (tag: string): TagArchive => {
    const slug = slugifyTag(tag);
    let record = records.get(slug);
    if (!record) {
      record = { name: tag, slug, post_count: 0, book_count: 0, total_count: 0, posts: [], books: [] };
      records.set(slug, record);
    }
    return record;
  };

  const postsOldestFirst = [...getAllPosts()].reverse();
  for (const post of postsOldestFirst) {
    for (const tag of post.frontmatter.tags ?? []) {
      if (!tag.trim()) continue;
      ensure(tag).posts.push(post);
    }
  }
  for (const book of getAllBooks()) {
    for (const tag of (book.frontmatter.tags as string[] | undefined) ?? []) {
      if (!tag.trim()) continue;
      ensure(tag).books.push(book);
    }
  }

  _tagArchives = [...records.values()]
    .map((record) => {
      // Same (date desc, path desc) tiebreak as getAllPosts — Jekyll resolves
      // same-day ties back to site.posts order, and the markdown twins
      // (scripts/next/lib/jekyll-content.mjs byDateDescStable) already do.
      record.posts.sort(
        (a, b) =>
          b.date.getTime() - a.date.getTime() ||
          (b.sourcePath > a.sourcePath ? 1 : b.sourcePath < a.sourcePath ? -1 : 0)
      );
      record.post_count = record.posts.length;
      record.book_count = record.books.length;
      record.total_count = record.post_count + record.book_count;
      return record;
    })
    .sort(
      (a, b) =>
        b.total_count - a.total_count ||
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
  return _tagArchives;
}

/**
 * The header nav. Curated: /books/ still exists (indexed URL, listed in the
 * sitemap) but is reachable from the Publications page rather than the nav —
 * the two were merged into one nav entry to keep the header simple.
 */
export const NAV_LINKS: { title: string; url: string }[] = [
  { title: "Blog", url: "/blog/" },
  { title: "Loops", url: "/awesome-loops/" },
  { title: "Publications", url: "/publications/" },
  { title: "Work", url: "/work/" },
];

export { getSiteConfig };
