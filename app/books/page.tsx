// Port of books.md (layout: page, custom_layout: true).
import { Fragment } from "react";
import BookCard from "@/components/cards/BookCard";
import { pageMeta } from "@/components/lib/page-meta";
import PageLayout from "@/components/site/PageLayout";
import { getAllBooks } from "@/lib/content";

const meta = pageMeta({
  title: "Books",
  url: "/books/",
  customLayout: true,
  stylesheets: [
    "/assets/css/components/content-cards.css",
    "/assets/css/pages/books-index.css",
  ],
});

export default function BooksIndex() {
  const books = getAllBooks();

  return (
    <PageLayout meta={meta}>
      <div className="books-container">
        <div className="books-list">
          {books.map((book, index) => (
            <Fragment key={book.slug}>
              <BookCard book={book} dateMode="iso" />
              {index < books.length - 1 ? <hr className="book-divider" /> : null}
            </Fragment>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
