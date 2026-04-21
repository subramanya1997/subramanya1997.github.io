require "fileutils"

# Several well-known URIs are defined without a file extension
# (RFC 9727 /.well-known/api-catalog, RFC 8414 /.well-known/oauth-authorization-server,
# OIDC Discovery /.well-known/openid-configuration, etc.). Jekyll always preserves the
# source extension on the permalink, so we emit the files as `.json` (to get the correct
# application/json Content-Type on GitHub Pages) and copy each one to its extensionless
# canonical path after the build.
ALIASES = [
  "api-catalog",
  "openid-configuration",
  "oauth-noop",
].freeze

Jekyll::Hooks.register :site, :post_write do |site|
  ALIASES.each do |name|
    source = File.join(site.dest, ".well-known", "#{name}.json")
    target = File.join(site.dest, ".well-known", name)
    next unless File.exist?(source)

    FileUtils.mkdir_p(File.dirname(target))
    FileUtils.cp(source, target)
  end
end
