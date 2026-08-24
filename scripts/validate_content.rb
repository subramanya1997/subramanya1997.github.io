#!/usr/bin/env ruby
# frozen_string_literal: true

require "date"
require "json"
require "pathname"
require "yaml"

ROOT = Pathname(__dir__).join("..").expand_path
POSTS_DIR = ROOT.join("_posts")
BOOKS_DIR = ROOT.join("_books")
LOOPS_DIR = ROOT.join("_loops")
DATA_DIR = ROOT.join("_data")
TOP_LEVEL_PAGES = %w[index.html blog.md books.md work.md stats.md].freeze
FRONT_MATTER_PATTERN = /\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\z)/m

class ValidationRunner
  def initialize
    @errors = []
  end

  def run
    validate_posts
    validate_books
    validate_loops
    validate_about_data
    validate_view_count_data
    validate_top_level_page_asset_guard
    validate_openapi_spec
    validate_trust_pages
    validate_llms_txt
    validate_404_recovery_links
    validate_api_catalog

    if @errors.empty?
      puts "Content validation passed."
      exit 0
    end

    warn "Content validation failed:"
    @errors.each { |error| warn "- #{error}" }
    exit 1
  end

  private

  def validate_posts
    required_keys = %w[layout title excerpt date tags]

    POSTS_DIR.glob("*.md").sort.each do |path|
      next if relative_path(path) == "_posts/readme.md"

      validate_front_matter(path, required_keys)
    end
  end

  def validate_books
    required_keys = %w[title excerpt date tags web_url]

    BOOKS_DIR.glob("*.md").sort.each do |path|
      validate_front_matter(path, required_keys)
    end
  end

  def validate_loops
    required_keys = %w[layout title excerpt]

    LOOPS_DIR.glob("*.md").sort.each do |path|
      validate_front_matter(path, required_keys)
      validate_loop_body(path)
      validate_loop_links(path)
    end
  end

  def validate_loop_body(path)
    _, body = parse_front_matter(path)
    return if present?(body)

    add_error("#{relative_path(path)}: loop body must contain the prompt or operating instructions")
  rescue StandardError => e
    add_error(e.message)
  end

  def validate_loop_links(path)
    front_matter, = parse_front_matter(path)
    links = stringify_keys(front_matter)["links"]
    return unless links

    unless links.is_a?(Array)
      add_error("#{relative_path(path)}: links must be an array")
      return
    end

    links.each_with_index do |link, index|
      unless link.is_a?(Hash)
        add_error("#{relative_path(path)}: links[#{index}] must be a mapping")
        next
      end

      normalized = stringify_keys(link)
      add_error("#{relative_path(path)}: links[#{index}] missing url") unless present?(normalized["url"])
    end
  rescue StandardError => e
    add_error(e.message)
  end

  def validate_front_matter(path, required_keys)
    front_matter, = parse_front_matter(path)
    normalized = stringify_keys(front_matter)
    missing_keys = required_keys.reject { |key| normalized.key?(key) && present?(normalized[key]) }

    return if missing_keys.empty?

    add_error("#{relative_path(path)}: missing required front matter keys: #{missing_keys.join(', ')}")
  rescue StandardError => e
    add_error(e.message)
  end

  def validate_about_data
    path = DATA_DIR.join("about.yaml")
    data = load_yaml(path)

    unless data.is_a?(Hash)
      add_error("#{relative_path(path)}: expected a mapping")
      return
    end

    %w[bio experience education].each do |key|
      next if data.key?(key) && present?(data[key])

      add_error("#{relative_path(path)}: missing required key #{key}")
    end
  rescue StandardError => e
    add_error(e.message)
  end

  def validate_view_count_data
    path = DATA_DIR.join("view_count.json")
    data = JSON.parse(path.read)

    unless data.is_a?(Hash)
      add_error("#{relative_path(path)}: expected a JSON object")
      return
    end

    add_error("#{relative_path(path)}: missing required key last_updated") unless present?(data["last_updated"])

    view_counts = data["view_counts"]
    unless view_counts.is_a?(Array)
      add_error("#{relative_path(path)}: view_counts must be an array")
      return
    end

    view_counts.each_with_index do |entry, index|
      unless entry.is_a?(Hash)
        add_error("#{relative_path(path)}: view_counts[#{index}] must be an object")
        next
      end

      %w[url views avg_duration_seconds engagement_rate].each do |key|
        add_error("#{relative_path(path)}: view_counts[#{index}] missing #{key}") unless entry.key?(key)
      end

      add_error("#{relative_path(path)}: view_counts[#{index}].url must be a string") unless entry["url"].is_a?(String)
      add_error("#{relative_path(path)}: view_counts[#{index}].views must be numeric") unless numeric?(entry["views"])
      add_error("#{relative_path(path)}: view_counts[#{index}].avg_duration_seconds must be numeric") unless numeric?(entry["avg_duration_seconds"])
      add_error("#{relative_path(path)}: view_counts[#{index}].engagement_rate must be numeric") unless numeric?(entry["engagement_rate"])
    end
  rescue JSON::ParserError => e
    add_error("#{relative_path(path)}: invalid JSON (#{e.message})")
  rescue StandardError => e
    add_error(e.message)
  end

  def validate_top_level_page_asset_guard
    TOP_LEVEL_PAGES.each do |relative|
      path = ROOT.join(relative)
      _, body = parse_front_matter(path)

      if body.match?(/<style\b/i)
        add_error("#{relative}: inline <style> blocks are not allowed")
      end

      if body.match?(/<script\b(?![^>]*\bsrc=)/im)
        add_error("#{relative}: inline <script> blocks are not allowed")
      end
    rescue StandardError => e
      add_error(e.message)
    end
  end

  # The OpenAPI spec is a plain static file (no front matter, no Liquid), so it
  # must parse as JSON straight from the repo and satisfy the invariants agents
  # rely on: unique operationIds and a description + responses on every operation.
  def validate_openapi_spec
    path = ROOT.join("openapi.json")
    spec = JSON.parse(path.read)

    add_error("openapi.json: openapi version must be 3.x") unless spec["openapi"].to_s.start_with?("3.")
    add_error("openapi.json: missing info.title") unless present?(spec.dig("info", "title"))
    add_error("openapi.json: missing info.contact.url") unless present?(spec.dig("info", "contact", "url"))
    add_error("openapi.json: servers must include https://subramanya.ai") unless
      Array(spec["servers"]).any? { |s| s["url"] == "https://subramanya.ai" }

    operation_ids = []
    Hash(spec["paths"]).each do |api_path, methods|
      Hash(methods).each do |verb, op|
        next unless %w[get post put patch delete].include?(verb)

        label = "openapi.json: #{verb.upcase} #{api_path}"
        add_error("#{label}: missing operationId") unless present?(op["operationId"])
        add_error("#{label}: missing description") unless present?(op["description"])
        add_error("#{label}: missing responses") unless op["responses"].is_a?(Hash) && !op["responses"].empty?
        operation_ids << op["operationId"]
      end
    end

    duplicates = operation_ids.tally.select { |_, count| count > 1 }.keys
    add_error("openapi.json: duplicate operationIds: #{duplicates.join(', ')}") unless duplicates.empty?
  rescue JSON::ParserError => e
    add_error("openapi.json: invalid JSON (#{e.message})")
  rescue StandardError => e
    add_error("openapi.json: #{e.message}")
  end

  # Trust anchor pages (/contact/, /privacy/) must exist with substantial bodies;
  # agents check these to verify the site is legitimate.
  def validate_trust_pages
    { "contact.md" => "/contact/", "privacy.md" => "/privacy/" }.each do |relative, expected_permalink|
      path = ROOT.join(relative)

      unless path.exist?
        add_error("#{relative}: trust anchor page is missing")
        next
      end

      front_matter, body = parse_front_matter(path)
      normalized = stringify_keys(front_matter)

      add_error("#{relative}: permalink must be #{expected_permalink}") unless normalized["permalink"] == expected_permalink
      add_error("#{relative}: missing title") unless present?(normalized["title"])
      add_error("#{relative}: body must be at least 500 characters (currently #{body.strip.length})") if body.strip.length < 500
    rescue StandardError => e
      add_error(e.message)
    end
  end

  # llms.txt must keep the agent-guidance sections that tell agents when and
  # how to use the site, and must point at the developer resources.
  def validate_llms_txt
    path = ROOT.join("llms.txt")
    content = path.read

    add_error("llms.txt: missing '## When to use this site' section") unless content.include?("## When to use this site")
    add_error("llms.txt: missing '## Developer Resources' section") unless content.include?("## Developer Resources")
    add_error("llms.txt: must reference /openapi.json") unless content.include?("/openapi.json")
  rescue StandardError => e
    add_error("llms.txt: #{e.message}")
  end

  # The 404 page must give agents recovery pointers (llms.txt, sitemap, search
  # index) so a dead link is not a dead end.
  def validate_404_recovery_links
    path = ROOT.join("404.html")
    content = path.read

    %w[/llms.txt /sitemap.xml /search.json /openapi.json].each do |href|
      add_error("404.html: missing recovery link to #{href}") unless content.include?(href)
    end
  rescue StandardError => e
    add_error("404.html: #{e.message}")
  end

  # The RFC 9727 api-catalog must advertise the OpenAPI service description.
  def validate_api_catalog
    path = ROOT.join("api-catalog.json")
    content = path.read

    add_error("api-catalog.json: missing service-desc link to /openapi.json") unless content.include?("/openapi.json")
  rescue StandardError => e
    add_error("api-catalog.json: #{e.message}")
  end

  def parse_front_matter(path)
    content = path.read
    match = content.match(FRONT_MATTER_PATTERN)

    raise "#{relative_path(path)}: missing or malformed front matter" unless match

    front_matter = YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: true)
    raise "#{relative_path(path)}: front matter must be a mapping" unless front_matter.is_a?(Hash)

    [front_matter, content[match.end(0)..] || ""]
  rescue Psych::SyntaxError => e
    raise "#{relative_path(path)}: invalid YAML front matter (#{e.message})"
  end

  def load_yaml(path)
    YAML.safe_load(path.read, permitted_classes: [Date, Time], aliases: true)
  rescue Psych::SyntaxError => e
    raise "#{relative_path(path)}: invalid YAML (#{e.message})"
  end

  def stringify_keys(hash)
    hash.each_with_object({}) { |(key, value), acc| acc[key.to_s] = value }
  end

  def present?(value)
    case value
    when nil
      false
    when String
      !value.strip.empty?
    when Array, Hash
      !value.empty?
    else
      true
    end
  end

  def numeric?(value)
    value.is_a?(Numeric)
  end

  def add_error(message)
    @errors << message
  end

  def relative_path(path)
    Pathname(path).relative_path_from(ROOT).to_s
  end
end

ValidationRunner.new.run
