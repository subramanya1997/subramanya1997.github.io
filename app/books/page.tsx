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
});

export default function BooksIndex() {
  const books = getAllBooks();

  return (
    <PageLayout meta={meta}>
      <div className="books-container">
        <header className="index-header">
          <h1>{meta.title}</h1>
        </header>
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
