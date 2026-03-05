import { books } from "@/lib/books";
import HomeSidebar from "@/components/HomeSidebar";
import PageLayout from "@/components/PageLayout";

export const metadata = {
  title: "Reading — Derek Leonhardt",
  description: "Books I'm reading and ones I'd recommend",
};

const reading = books.filter((b) => b.status === "reading");
const read = books.filter((b) => b.status === "read");

export default function ReadingPage() {
  return (
    <PageLayout sidebar={<HomeSidebar />} maxWidth="var(--content-width)">
      <div className="page-header">
        <h1>Reading</h1>
        <p>Books I&apos;m reading and ones I&apos;d recommend</p>
      </div>

      <div className="section-start">
        {reading.length > 0 && (
          <div className="section-break">
            <span className="label label-rule">Currently Reading</span>
            <div className="stack-wide">
              {reading.map((book) => (
                <BookEntry key={book.title} book={book} />
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="label label-rule">Read</span>
          <div className="stack-wide">
            {read.map((book) => (
              <BookEntry key={book.title} book={book} />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function BookEntry({ book }: { book: (typeof books)[number] }) {
  return (
    <div className="book-entry">
      <div className="split-baseline">
        <span className="book-entry__title">{book.title}</span>
        {book.finishedYear && (
          <span className="text-muted book-entry__year">
            {book.finishedYear}
          </span>
        )}
      </div>
      <span
        className={`text-muted book-entry__author${book.thoughts ? " book-entry__author--spaced" : ""}`}
      >
        {book.author}
      </span>
      {book.thoughts && (
        <p className="text-muted book-entry__thoughts">{book.thoughts}</p>
      )}
    </div>
  );
}
