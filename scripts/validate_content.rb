#!/usr/bin/env ruby
# frozen_string_literal: true

require "date"
require "json"
require "pathname"
require "yaml"

ROOT = Pathname(__dir__).join("..").expand_path
POSTS_DIR = ROOT.join("_posts")
BOOKS_DIR = ROOT.join("_books")
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
    validate_about_data
    validate_view_count_data
    validate_top_level_page_asset_guard

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
