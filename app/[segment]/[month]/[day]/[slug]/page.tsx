// Post pages — Jekyll's `permalink: pretty` (/:year/:month/:day/:title/).
//
// The first segment is the publication year. It is named `[segment]` rather
// than `[year]` because Next requires every dynamic route at the same level to
// share one slug name, and the sibling `app/[segment]/page.tsx` uses it for the
// legacy `/tags-<slug>/` redirect pages.
import { notFound } from "next/navigation";
import { readingTime, stripHtml, stripNewlines } from "@/components/lib/jekyll";
import { pageMeta } from "@/components/lib/page-meta";
import {
  isoDay,
  postSocialImage,
  readingMinutes,
  slashDate,
  xmlSchemaDate,
} from "@/components/lib/post-extras";
import { getSiteConfig } from "@/components/lib/site-data";
import PostLayout from "@/components/post/PostLayout";
import type { FaqItem } from "@/components/post/post-faq";
import { getAllPosts, getPost } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({
    segment: post.year,
    month: post.month,
    day: post.day,
    slug: post.slug,
  }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ segment: string; month: string; day: string; slug: string }>;
}) {
  const { segment, month, day, slug } = await params;
  const post = getPost(segment, month, day, slug);
  if (!post) notFound();

  const site = getSiteConfig();
  const { html } = await renderMarkdown(post.content);
  const fm = post.frontmatter;

  // `head.html`'s twitter:data1 reads `page.content`, which Jekyll set to the
  // converter output *before* the link_attributes post-render hook ran — the
  // derived `title`/`target`/`rel` attributes would otherwise inflate
  // `number_of_words` by enough to shift the estimate on 10 of the 39 posts.
  const preHookHtml = (await renderMarkdown(post.content, { linkAttributes: false })).html;

  const faq: FaqItem[] = await Promise.all(
    (fm.faq ?? []).map(async (item) => ({
      q: item.q,
      answerHtml: (await renderMarkdown(item.a)).html,
    }))
  );

  const author = typeof fm.author === "string" ? fm.author : site.title;
  const description = fm.description ?? fm.excerpt;

  const meta = pageMeta({
    title: fm.title,
    url: post.url,
    description: description ? String(description) : undefined,
    image: postSocialImage(post),
    isPost: true,
    article: {
      publishedTime: xmlSchemaDate(post.date),
      author,
      tags: fm.tags ?? [],
      readingMinutes: readingMinutes(preHookHtml),
      citationDate: slashDate(post.date),
      abstract: fm.excerpt ? stripNewlines(stripHtml(String(fm.excerpt))) : "",
      isoDate: isoDay(post.date),
      year: String(post.date.getUTCFullYear()),
    },
  });

  return (
    <PostLayout
      meta={meta}
      post={post}
      contentHtml={html}
      readingTime={readingTime(html)}
      faq={faq}
    />
  );
}
