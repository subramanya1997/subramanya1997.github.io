## Summary


## Loop Marketplace Checklist

- [ ] New or changed loop listings live in `_loops/`.
- [ ] Every loop has a title, short description, and usable prompt or instructions.
- [ ] Optional source, attribution, MCP/resource links, and verification fields are accurate when provided.
- [ ] The loop does not require secrets, credentials, private data, or unapproved destructive actions.
- [ ] Agent export formats still make sense for Claude, Codex, and Cursor.

## Validation

- [ ] `ruby scripts/validate_content.rb`
- [ ] `bundle exec jekyll build`
