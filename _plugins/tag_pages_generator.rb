# frozen_string_literal: true

module Jekyll
  class TagArchivePage < PageWithoutAFile
    def initialize(site, tag_record)
      super(site, site.source, File.join("tags", tag_record[:slug]), "index.html")

      self.data ||= {}
      self.data["layout"] = "page"
      self.data["custom_layout"] = true
      self.data["title"] = tag_record[:name]
      self.data["description"] = "Posts and books tagged #{tag_record[:name]}."
      self.data["page_stylesheets"] = [
        "/assets/css/components/content-cards.css",
        "/assets/css/pages/tags.css"
      ]
      self.data["tag_name"] = tag_record[:name]
      self.data["tag_slug"] = tag_record[:slug]
      self.data["tag_posts"] = tag_record[:posts]
      self.data["tag_books"] = tag_record[:books]
      self.data["tag_post_count"] = tag_record[:post_count]
      self.data["tag_book_count"] = tag_record[:book_count]
      self.data["tag_total_count"] = tag_record[:total_count]
      self.content = "{% include tag-archive.html %}"
    end
  end

  class LegacyTagRedirectPage < PageWithoutAFile
    def initialize(site, tag_record)
      super(site, site.source, "tags-#{tag_record[:slug]}", "index.html")

      self.data ||= {}
      self.data["layout"] = "default"
      self.data["title"] = "Redirecting..."
      self.data["robots"] = "noindex, nofollow"
      self.data["legacy_tag_target"] = File.join(site.config["baseurl"].to_s, "tags", tag_record[:slug], "/")
      self.content = <<~LIQUID
        <div class="post">
          <header class="post-header">
            <h1>Redirecting…</h1>
          </header>
          <article class="post-content">
            <p>If you are not redirected automatically, <a href="{{ page.legacy_tag_target }}" id="legacy-tag-link">open the current tag archive</a>.</p>
          </article>
        </div>
        <script>
          (function() {
            var target = {{ page.legacy_tag_target | jsonify }};
            var hash = window.location.hash || "";
            var search = window.location.search || "";
            window.location.replace(target + search + hash);
          })();
        </script>
        <noscript>
          <meta http-equiv="refresh" content="0; url={{ page.legacy_tag_target }}">
        </noscript>
      LIQUID
    end
  end

  class TagPagesGenerator < Generator
    safe true
    priority :normal

    def generate(site)
      tag_records = build_tag_records(site)

      site.data["tag_archives"] = tag_records.map do |record|
        {
          "name" => record[:name],
          "slug" => record[:slug],
          "post_count" => record[:post_count],
          "book_count" => record[:book_count],
          "total_count" => record[:total_count]
        }
      end

      tag_records.each do |record|
        site.pages << TagArchivePage.new(site, record)
        site.pages << LegacyTagRedirectPage.new(site, record)
      end
    end

    private

    def build_tag_records(site)
      records = Hash.new do |hash, slug|
        hash[slug] = { name: nil, slug: slug, posts: [], books: [] }
      end

      add_documents(site.posts.docs, records, :posts)
      add_documents(site.collections.fetch("books").docs, records, :books)

      records.values.map do |record|
        record[:posts] = sort_documents(record[:posts])
        record[:books] = sort_documents(record[:books])
        record[:post_count] = record[:posts].length
        record[:book_count] = record[:books].length
        record[:total_count] = record[:post_count] + record[:book_count]
        record
      end.sort_by { |record| [-record[:total_count], record[:name].downcase] }
    end

    def add_documents(documents, records, bucket)
      documents.each do |document|
        Array(document.data["tags"]).each do |tag|
          next if tag.to_s.strip.empty?

          slug = Jekyll::Utils.slugify(tag.to_s)
          record = records[slug]
          record[:name] ||= tag.to_s
          record[bucket] << document
        end
      end
    end

    def sort_documents(documents)
      documents.sort_by { |document| document.date || Time.at(0) }.reverse
    end
  end
end
