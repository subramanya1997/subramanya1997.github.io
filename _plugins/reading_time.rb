module ReadingTimeFilter
  def reading_time(input)
    # Define words per minute - average reading speed
    words_per_minute = 200

    # Count words using a simple regex
    words = input.to_s.scan(/\w+/).count
    
    # Calculate reading time
    minutes = (words / words_per_minute).floor
    seconds = ((words % words_per_minute) / (words_per_minute / 60)).floor
    
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
  end
end

Liquid::Template.register_filter(ReadingTimeFilter) 