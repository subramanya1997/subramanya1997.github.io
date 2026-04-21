# frozen_string_literal: true

require "fileutils"
require "yaml"

module Jekyll
  # A StaticFile subclass that writes arbitrary, in-memory markdown content to
  # the destination directory. We go through StaticFile rather than Page so
  # Jekyll does not run the content through kramdown (which would convert it
  # to HTML and defeat the whole point of a markdown twin).
  class MarkdownTwinFile < StaticFile
    def initialize(site, relative_path, content)
      @site = site
      @base = site.source
      @dir = File.dirname(relative_path)
      @name = File.basename(relative_path)
      @relative_path = relative_path
      @extname = File.extname(@name)
      @type = nil
      @collection = nil
      @content = content
    end

    def path
      @relative_path
    end

    def destination(dest)
      @destination ||= File.join(dest, @relative_path)
    end

    def modified?
      true
    end

    def write(dest)
      dest_path = destination(dest)
      FileUtils.mkdir_p(File.dirname(dest_path))
      File.write(dest_path, @content)
      true
    end

    def to_liquid
      {
        "path" => @relative_path,
        "extname" => @extname,
        "modified_time" => Time.now
      }
    end
  end

  # Generator that emits a `.md` twin for every HTML page on the site. Since
  # GitHub Pages cannot do HTTP content negotiation on the `Accept` header, we
  # publish each page's markdown representation at a predictable parallel URL
  # (`{url}index.md`). GitHub Pages serves `.md` files as
  # `Content-Type: text/markdown; charset=utf-8` out of the box. The HTML
  # `<head>` advertises the twin via `<link rel="alternate" type="text/markdown">`.
  class MarkdownTwinGenerator < Generator
    safe true
    priority :low

    # URLs we never want to mirror as markdown.
    SKIP_EXACT = %w[
      /feed.xml
      /sitemap.xml
      /sitemapindex.xml
      /sitemap-media.xml
      /llms.txt
      /llms-full.txt
      /robots.txt
      /search.json
      /404.html
      /CNAME
    ].freeze

    SKIP_EXTENSIONS = %w[.xml .json .txt .ico .pdf .png .jpg .jpeg .webp .gif .svg .css .js].freeze
    SKIP_PREFIXES   = %w[/assets/ /css/ /scripts/ /docs/].freeze

    def generate(site)
      @site = site

      attach_twin(site, :post) { |list| list.concat(site.posts.docs) }
      attach_twin(site, :book) { |list| list.concat(site.collections.fetch("books", Collection.new(site, "books")).docs) }
      attach_twin(site, :page) do |list|
        site.pages.each do |page|
          list << page if page.url.end_with?("/")
        end
      end
    end

    private

    def attach_twin(site, kind)
      sources = []
      yield(sources)

      sources.each do |source|
        next if skip?(source)

        twin_url, content = build_twin(kind, source)
        next if twin_url.nil?

        site.static_files << MarkdownTwinFile.new(site, twin_url, content)
        source.data ||= {}
        source.data["markdown_url"] = twin_url
      end
    end

    def skip?(source)
      return true if source.data.is_a?(Hash) && source.data["markdown_twin"] == false

      # The tag_pages_generator plugin emits client-side redirect stubs at
      # /tags-<slug>/. They carry no real content, so don't mirror them.
      return true if source.data.is_a?(Hash) && source.data["legacy_tag_target"]

      url = source.url.to_s
      return true if url.empty?
      return true if SKIP_EXACT.include?(url)
      return true if SKIP_PREFIXES.any? { |prefix| url.start_with?(prefix) }
      return true if url.match?(%r{\A/tags-[^/]+/\z})

      ext = File.extname(url)
      return true if !ext.empty? && SKIP_EXTENSIONS.include?(ext.downcase) && !url.end_with?("/")

      false
    end

    def build_twin(kind, source)
      twin_url = File.join(source.url, "index.md")

      case kind
      when :post
        [twin_url, document_twin(source, include_date: true)]
      when :book
        [twin_url, document_twin(source, include_date: false)]
      when :page
        [twin_url, page_twin(source)]
      end
    end

    def document_twin(doc, include_date:)
      front = {
        "title" => doc.data["title"],
        "description" => short_text(doc.data["excerpt"] || doc.data["description"]),
        "url" => absolute_url(doc.url),
        "tags" => Array(doc.data["tags"])
      }
      front["date"] = doc.date.strftime("%Y-%m-%d") if include_date && doc.respond_to?(:date) && doc.date
      front["author"] = doc.data["author"] if doc.data["author"]

      front.reject! { |_, v| v.nil? || (v.respond_to?(:empty?) && v.empty? && !v.is_a?(Numeric)) }

      body = render_liquid(doc.content.to_s, doc)

      "#{to_front_matter(front)}\n# #{doc.data["title"]}\n\n#{body.strip}\n"
    end

    def page_twin(page)
      title = page.data["title"] || @site.config["title"].to_s
      description = page.data["description"].to_s

      body =
        case page.url
        when "/"        then render_home
        when "/blog/"   then render_blog
        when "/books/"  then render_books_index
        when "/tags/"   then render_tags_index
        when "/work/"   then render_work
        when "/stats/"  then render_stats(title, description)
        when "/search/" then render_search(title, description)
        else
          if page.data["tag_slug"]
            render_tag_detail(page)
          else
            render_generic_page(page, title, description)
          end
        end

      front = {
        "title" => title,
        "description" => short_text(description),
        "url" => absolute_url(page.url)
      }.reject { |_, v| v.nil? || v.to_s.empty? }

      "#{to_front_matter(front)}\n#{body.strip}\n"
    end

    # --- Page renderers ---

    def render_home
      about = @site.data["about"] || {}
      bio = [about["bio"], about["research_interest"], about["history"]].compact.map { |s| strip_html(s) }.reject(&:empty?)
      lines = ["# #{@site.config["title"]}", ""]
      lines << @site.config["description"].to_s unless @site.config["description"].to_s.empty?
      lines << "" unless bio.empty?
      lines.concat(bio)
      lines << ""

      unless (books = @site.collections["books"]&.docs || []).empty?
        lines << "## Books"
        lines << ""
        books.each { |book| lines << "- [#{book.data["title"]}](#{absolute_url(book.url)})" }
        lines << ""
      end

      unless (posts = @site.posts.docs).empty?
        lines << "## Blog"
        lines << ""
        posts.reverse_each do |post|
          lines << "- [#{post.data["title"]}](#{absolute_url(post.url)}) — #{short_text(post.data["excerpt"], words: 25)}"
        end
        lines << ""
      end

      lines.join("\n")
    end

    def render_blog
      lines = ["# Blog", "", "All posts, newest first.", ""]
      @site.posts.docs.reverse_each do |post|
        date = post.date ? post.date.strftime("%Y-%m-%d") : ""
        lines << "- #{date} — [#{post.data["title"]}](#{absolute_url(post.url)}) — #{short_text(post.data["excerpt"], words: 25)}"
      end
      lines.join("\n")
    end

    def render_books_index
      lines = ["# Books", ""]
      books = @site.collections["books"]&.docs || []
      if books.empty?
        lines << "_No books yet._"
      else
        books.each do |book|
          lines << "- [#{book.data["title"]}](#{absolute_url(book.url)}) — #{short_text(book.data["excerpt"], words: 30)}"
        end
      end
      lines.join("\n")
    end

    def render_tags_index
      lines = ["# Tags", "", "Browse posts and books by topic.", ""]
      records = @site.data["tag_archives"] || []
      records.each do |tag|
        slug = tag["slug"]
        count = tag["total_count"]
        lines << "- [#{tag["name"]}](#{absolute_url("/tags/#{slug}/")}) — #{count} item#{count == 1 ? "" : "s"}"
      end
      lines.join("\n")
    end

    def render_tag_detail(page)
      title = page.data["title"] || page.data["tag_name"]
      posts = page.data["tag_posts"] || []
      books = page.data["tag_books"] || []

      lines = ["# Tag: #{title}", ""]
      lines << "Posts and books tagged #{title}."
      lines << ""

      unless posts.empty?
        lines << "## Posts"
        lines << ""
        posts.each do |post|
          date = post.respond_to?(:date) && post.date ? post.date.strftime("%Y-%m-%d") : ""
          prefix = date.empty? ? "" : "#{date} — "
          lines << "- #{prefix}[#{post.data["title"]}](#{absolute_url(post.url)})"
        end
        lines << ""
      end

      unless books.empty?
        lines << "## Books"
        lines << ""
        books.each do |book|
          lines << "- [#{book.data["title"]}](#{absolute_url(book.url)})"
        end
        lines << ""
      end

      lines.join("\n")
    end

    def render_work
      about = @site.data["about"] || {}
      lines = ["# Work", ""]

      unless about["bio"].to_s.empty?
        lines << strip_html(about["bio"])
        lines << ""
      end

      experience = Array(about["experience"])
      unless experience.empty?
        lines << "## Experience"
        lines << ""
        experience.each do |entry|
          header = [entry["position"], entry["company"]].compact.join(" — ")
          lines << "### #{header}"
          meta = [entry["location"], entry["period"]].compact.reject(&:empty?).join(" · ")
          lines << "_#{meta}_" unless meta.empty?
          lines << ""
          lines << strip_html(entry["description"]) unless entry["description"].to_s.empty?
          achievements = Array(entry["achievements"])
          unless achievements.empty?
            lines << ""
            achievements.each { |a| lines << "- #{strip_html(a)}" }
          end
          lines << ""
        end
      end

      education = Array(about["education"])
      unless education.empty?
        lines << "## Education"
        lines << ""
        education.each do |entry|
          header = [entry["degree"], entry["institution"]].compact.join(" — ")
          lines << "### #{header}"
          meta = [entry["location"], entry["period"]].compact.reject(&:empty?).join(" · ")
          lines << "_#{meta}_" unless meta.empty?
          lines << ""
          lines << strip_html(entry["description"]) unless entry["description"].to_s.empty?
          details = Array(entry["details"])
          unless details.empty?
            lines << ""
            details.each do |detail|
              text =
                if detail.is_a?(Hash)
                  detail.map { |k, v| "**#{k}:** #{v}" }.join(" ")
                else
                  detail.to_s
                end
              lines << "- #{strip_html(text)}"
            end
          end
          lines << ""
        end
      end

      cv = about["cv_file"]
      lines << "Résumé: #{absolute_url(cv)}" unless cv.to_s.empty?

      lines.join("\n")
    end

    def render_stats(title, description)
      lines = ["# #{title || "Stats"}", ""]
      lines << description unless description.to_s.empty?
      lines << ""
      lines << "Live analytics dashboard: #{absolute_url("/stats/")}."
      lines.join("\n")
    end

    def render_search(title, description)
      lines = ["# #{title || "Search"}", ""]
      lines << description unless description.to_s.empty?
      lines << ""
      lines << "Interactive search UI: #{absolute_url("/search/")}."
      lines << ""
      lines << "Machine-readable index: #{absolute_url("/search.json")}."
      lines.join("\n")
    end

    def render_generic_page(page, title, description)
      lines = ["# #{title}", ""]
      lines << strip_html(description) unless description.to_s.empty?
      lines << ""
      body = render_liquid(page.content.to_s, page)
      markdown = html_to_markdown_fallback(body)
      lines << markdown unless markdown.to_s.strip.empty?
      lines.join("\n")
    end

    # --- Helpers ---

    def render_liquid(template, doc)
      return template.to_s unless template.to_s.include?("{")

      payload = @site.site_payload
      payload["page"] = doc.to_liquid
      Liquid::Template.parse(template).render!(
        payload,
        registers: { site: @site, page: doc }
      )
    rescue StandardError => e
      Jekyll.logger.warn "MarkdownTwin:", "Liquid render failed for #{doc.url}: #{e.message}"
      template.to_s
    end

    def html_to_markdown_fallback(body)
      text = body.to_s
      text = text.gsub(%r{<script\b[^>]*>.*?</script>}mi, "")
      text = text.gsub(%r{<style\b[^>]*>.*?</style>}mi, "")
      text = text.gsub(%r{<svg\b[^>]*>.*?</svg>}mi, "")
      text = text.gsub(%r{<!--.*?-->}m, "")
      text = text.gsub(/<[^>]+>/, " ")
      text = text.gsub(/\s+/, " ")
      text.strip
    end

    def short_text(value, words: 40)
      text = strip_html(value.to_s)
      tokens = text.split(/\s+/).reject(&:empty?)
      return "" if tokens.empty?
      return text if tokens.length <= words
      "#{tokens.first(words).join(" ")}…"
    end

    def strip_html(text)
      text.to_s.gsub(%r{<script\b[^>]*>.*?</script>}mi, "")
        .gsub(%r{<style\b[^>]*>.*?</style>}mi, "")
        .gsub(/<[^>]+>/, " ")
        .gsub(/&amp;/, "&")
        .gsub(/&lt;/, "<")
        .gsub(/&gt;/, ">")
        .gsub(/&quot;/, '"')
        .gsub(/&#39;/, "'")
        .gsub(/\s+/, " ")
        .strip
    end

    def absolute_url(path)
      base = @site.config["url"].to_s.chomp("/")
      "#{base}#{path}"
    end

    def to_front_matter(hash)
      yaml = YAML.dump(hash)
      yaml = yaml.sub(/\A---\s*\n/, "---\n")
      "#{yaml}---\n"
    end
  end
end
