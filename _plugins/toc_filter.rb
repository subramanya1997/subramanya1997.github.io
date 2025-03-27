require 'nokogiri'

module Jekyll
  module TOCFilter
    def toc_only(html)
      doc = Nokogiri::HTML(html)
      
      # Find all heading elements
      headings = doc.css('h1, h2, h3, h4, h5, h6')
      
      return '' if headings.empty?
      
      # Generate a unique ID for each heading if it doesn't have one
      headings.each_with_index do |heading, index|
        heading['id'] = "toc-#{index}-#{heading.text.downcase.gsub(/[^\w]+/, '-')}" if heading['id'].nil? || heading['id'].empty?
      end
      
      # Create toc as a Jekyll-compatible HTML string
      toc = '<ul>'
      
      # Track heading levels to create nested lists
      current_level = 2 # Start at h2 for most content
      headings.each do |heading|
        level = heading.name[1].to_i
        
        # Skip h1 as it's typically the title
        next if level == 1
        
        # Handle indentation and nesting
        if level > current_level
          # Start a new nested list for each level deeper
          (level - current_level).times do
            toc << '<ul>'
          end
        elsif level < current_level
          # Close lists when going back up the hierarchy
          (current_level - level).times do
            toc << '</ul>'
          end
        end
        
        current_level = level
        
        # Add the heading as a list item with link
        toc << %Q{<li><a href="##{heading['id']}">#{heading.text}</a></li>}
      end
      
      # Close any remaining open lists
      (current_level - 2).times do
        toc << '</ul>'
      end
      
      toc << '</ul>'
      
      # Return the toc
      toc
    end
  end
end

Liquid::Template.register_filter(Jekyll::TOCFilter) 