module Jekyll
    class MediaSitemapGenerator < Generator
      safe true
      priority :low
  
      def generate(site)
        asset_dir = File.join(site.source, 'assets')
        asset_files = Dir.glob(File.join(asset_dir, '**', '*'))
                         .select { |file| File.file?(file) }
                         .map { |file| file.sub(site.source, '') }
  
        # Create the media sitemap content
        media_sitemap_content = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
        media_sitemap_content += "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
  
        asset_files.each do |file|
          media_url = "#{site.config['url']}#{file}"
          media_sitemap_content += "  <url>\n"
          media_sitemap_content += "    <loc>#{media_url}</loc>\n"
          media_sitemap_content += "    <changefreq>weekly</changefreq>\n"
          media_sitemap_content += "    <priority>0.5</priority>\n"
          media_sitemap_content += "  </url>\n"
        end
  
        media_sitemap_content += "</urlset>\n"
  
        # Define the desired output path
        output_path = File.join(site.source, 'sitemap-media.xml')
  
        # Write the media sitemap to the specified location
        File.write(output_path, media_sitemap_content)
  
        # Output each asset file to the console for debugging
        asset_files.each { |file| puts "Added to media sitemap: #{file}" }
      end
    end
  end
  