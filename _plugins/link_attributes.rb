# frozen_string_literal: true

require "nokogiri"
require "uri"

module Jekyll
  # Post-render pass over every rendered HTML page that normalizes anchor
  # attributes for SEO and usability:
  #
  #   1. External links get target="_blank" and a rel containing "noopener"
  #      so they open in a new tab without handing the opener to the target.
  #   2. Links without a title attribute get one derived from their
  #      aria-label, visible text, or contained image alt text.
  #
  # Running at build time means the attributes exist in the static HTML that
  # crawlers and SEO auditors see, instead of being patched in with JS.
  module LinkAttributes
    TITLE_MAX_LENGTH = 120

    class << self
      def process(html, site)
        doc = Nokogiri::HTML5(html)
        changed = false

        doc.css("a[href]").each do |anchor|
          href = anchor["href"].to_s.strip
          next if href.empty? || href.start_with?("#", "javascript:")

          changed |= ensure_new_tab(anchor) if external?(href, site)
          changed |= ensure_title(anchor)
        end

        changed ? doc.to_html : html
      end

      private

      def ensure_new_tab(anchor)
        changed = false
        unless anchor["target"]
          anchor["target"] = "_blank"
          changed = true
        end
        rel = anchor["rel"].to_s.split
        unless rel.include?("noopener")
          anchor["rel"] = (rel + %w[noopener]).join(" ")
          changed = true
        end
        changed
      end

      def ensure_title(anchor)
        return false unless anchor["title"].to_s.strip.empty?

        title = derive_title(anchor)
        return false unless title

        anchor["title"] = title
        true
      end

      def derive_title(anchor)
        text = anchor["aria-label"].to_s.strip
        text = anchor.text.gsub(/\s+/, " ").strip if text.empty?
        if text.empty?
          image = anchor.at_css("img[alt]")
          text = image["alt"].to_s.strip if image
        end
        return nil if text.empty?

        if text.length > TITLE_MAX_LENGTH
          text = "#{text[0, TITLE_MAX_LENGTH - 1].rstrip}…"
        end
        text
      end

      def external?(href, site)
        return false unless href.match?(%r{\Ahttps?://}i)

        host = begin
          URI.parse(href).host
        rescue URI::InvalidURIError
          nil
        end
        return false unless host

        host != site_host(site)
      end

      def site_host(site)
        @site_host ||= begin
          URI.parse(site.config["url"].to_s).host
        rescue URI::InvalidURIError
          nil
        end
      end
    end
  end
end

Jekyll::Hooks.register [:pages, :documents], :post_render do |item|
  next unless item.output_ext == ".html"
  next if item.output.to_s.empty?

  item.output = Jekyll::LinkAttributes.process(item.output, item.site)
end
