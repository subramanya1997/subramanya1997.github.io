// Handbook chapters and articles. The `page` param keeps the `.html` suffix
// the HonKit build published (e.g. "the-boulders.html"), so every indexed URL
// resolves unchanged; Next treats an extension-bearing path as a file and
// skips the trailing-slash redirect for it.
import { notFound } from "next/navigation";
import HandbookLayout from "@/components/handbook/HandbookLayout";
import { handbookPage, handbookPages, renderHandbookPage } from "@/lib/handbook";

export const dynamicParams = false;

export function generateStaticParams() {
  return handbookPages()
    .filter((page) => page.route.includes("/"))
    .map((page) => {
      const [section, file] = page.route.split("/");
      return { section, page: file };
    });
}

export default async function HandbookArticle({
  params,
}: {
  params: Promise<{ section: string; page: string }>;
}) {
  const { section, page: file } = await params;
  const page = handbookPage(`${section}/${file}`);
  if (!page) notFound();
  const { heading, html } = await renderHandbookPage(page);

  return <HandbookLayout page={page} heading={heading} contentHtml={html} />;
}
