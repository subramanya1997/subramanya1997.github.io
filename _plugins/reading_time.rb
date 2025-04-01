module ReadingTimeFilter
  def reading_time(input)
    # Define words per minute - average reading speed
    words_per_minute = 200

    # Handle nil or empty input
    return "less than a minute read" if input.nil? || input.empty?

    # Convert to string if not already
    input_text = input.to_s

    # Count words using a more robust regex that handles various types of content
    # This includes handling HTML tags and different types of whitespace
    words = input_text.gsub(/<\/?[^>]*>/, "").gsub(/\s+/, " ").split(" ").length
    
    # Calculate reading time
    minutes = (words / words_per_minute).floor
    seconds = ((words % words_per_minute) / (words_per_minute / 60.0)).floor
    
    # Format the reading time
    if minutes > 0
      if minutes == 1
        "#{minutes} min read"
      else
        "#{minutes} mins read"
      end
    else
      if seconds < 30
        "less than a minute read"
      else
        "1 min read"
      end
    end
  rescue => e
    # In case of any error, return a safe default
    "1 min read"
  end
end

# Register the filter
Liquid::Template.register_filter(ReadingTimeFilter) 