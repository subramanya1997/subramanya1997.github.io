#!/usr/bin/env python3
"""Post-build validation of the machine-readable API surface in _site/.

Run after `bundle exec jekyll build`. Checks that every endpoint documented in
openapi.json exists in the build and that the JSON payloads actually match the
schemas the spec promises - so spec-vs-reality drift fails CI instead of
shipping. Stdlib only.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "_site"
ORIGIN = "https://subramanya.ai"

errors = []


def err(message):
    errors.append(message)


def load_json(relative):
    path = SITE / relative
    if not path.exists():
        err(f"{relative}: missing from build output")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        err(f"{relative}: invalid JSON ({exc})")
        return None


def site_path_for(url_path):
    return SITE / url_path.lstrip("/")


def check_openapi(spec):
    if not str(spec.get("openapi", "")).startswith("3."):
        err("openapi.json: openapi version must be 3.x")

    operation_ids = []
    for api_path, methods in spec.get("paths", {}).items():
        for verb, op in methods.items():
            if verb not in ("get", "post", "put", "patch", "delete"):
                continue
            label = f"openapi.json: {verb.upper()} {api_path}"
            if not op.get("operationId"):
                err(f"{label}: missing operationId")
            if not op.get("description"):
                err(f"{label}: missing description")
            if not op.get("responses"):
                err(f"{label}: missing responses")
            operation_ids.append(op.get("operationId"))

        # Every concrete (non-templated) documented path must exist in _site.
        if "{" not in api_path and not site_path_for(api_path).exists():
            err(f"openapi.json: documented path {api_path} missing from _site")

    duplicates = {o for o in operation_ids if operation_ids.count(o) > 1}
    if duplicates:
        err(f"openapi.json: duplicate operationIds: {sorted(duplicates)}")

    if not any(p.startswith("/api/v1/") for p in spec.get("paths", {})):
        err("openapi.json: versioned /api/v1/ surface is no longer documented")


def check_search(spec):
    items = load_json("search.json")
    if items is None:
        return
    if not isinstance(items, list) or not items:
        err("search.json: expected a non-empty array")
        return

    schema = spec["paths"]["/search.json"]["get"]["responses"]["200"]["content"][
        "application/json"
    ]["schema"]["items"]
    allowed_kinds = set(schema["properties"]["kind"]["enum"])
    required = set(schema.get("required", []))

    seen_urls = set()
    for item in items:
        title = str(item.get("title"))[:60]
        missing = required - item.keys()
        if missing:
            err(f"search.json: '{title}' missing required fields {sorted(missing)}")
        if item.get("kind") not in allowed_kinds:
            err(
                f"search.json: '{title}' kind '{item.get('kind')}' not in the "
                f"OpenAPI SearchItem enum {sorted(allowed_kinds)} - update the spec"
            )
        if item["url"] in seen_urls:
            err(f"search.json: duplicate url {item['url']}")
        seen_urls.add(item["url"])
        for field in ("views", "reading_minutes"):
            value = item.get(field)
            if value is not None and not isinstance(value, int):
                err(f"search.json: '{title}' {field} must be integer or null, got {value!r}")
        for tag in item.get("tags", []):
            if not isinstance(tag, dict) or "name" not in tag or "slug" not in tag:
                err(f"search.json: '{title}' tag entries must be objects with name+slug, got {tag!r}")
                break
        if item["kind"] == "post":
            page = site_path_for(item["url"] + "index.html")
            if not page.exists():
                err(f"search.json: post url {item['url']} has no built page")


def check_collection(relative, list_key, expected_kind):
    data = load_json(relative)
    if data is None:
        return
    if data.get("api_version") != "v1" or data.get("kind") != expected_kind:
        err(f"{relative}: envelope must have api_version=v1 and kind={expected_kind}")
    entries = data.get(list_key)
    if not isinstance(entries, list):
        err(f"{relative}: {list_key} must be an array")
        return
    if data.get("count") != len(entries):
        err(f"{relative}: count {data.get('count')} != len({list_key}) {len(entries)}")
    for entry in entries:
        title = str(entry.get("title"))[:60]
        for field in ("title", "url", "markdown_url", "date"):
            if not entry.get(field):
                err(f"{relative}: '{title}' missing {field}")
        if not str(entry.get("url", "")).startswith(ORIGIN):
            err(f"{relative}: '{title}' url must be absolute under {ORIGIN}")
        markdown_url = str(entry.get("markdown_url", ""))
        if not markdown_url.endswith("index.md"):
            err(f"{relative}: '{title}' markdown_url must end in index.md")
        elif not site_path_for(markdown_url.replace(ORIGIN, "")).exists():
            err(f"{relative}: '{title}' markdown twin missing from build: {markdown_url}")
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(entry.get("date", ""))):
            err(f"{relative}: '{title}' date must be YYYY-MM-DD")
    if relative.endswith("posts.json") and len(entries) >= 2:
        if entries[0]["date"] < entries[-1]["date"]:
            err(f"{relative}: posts must be sorted newest first")


def check_tags():
    data = load_json("api/v1/tags.json")
    if data is None:
        return
    if data.get("api_version") != "v1" or data.get("kind") != "tag_list":
        err("api/v1/tags.json: envelope must have api_version=v1 and kind=tag_list")
    tags = data.get("tags")
    if not isinstance(tags, list) or not tags:
        err("api/v1/tags.json: tags must be a non-empty array")
        return
    if data.get("count") != len(tags):
        err(f"api/v1/tags.json: count {data.get('count')} != len(tags) {len(tags)}")
    for tag in tags:
        name = str(tag.get("name"))[:40]
        for field in ("name", "slug", "post_count", "archive_url"):
            if field not in tag or tag[field] in (None, ""):
                err(f"api/v1/tags.json: tag '{name}' missing {field}")
        if not isinstance(tag.get("post_count"), int) or tag.get("post_count", 0) < 1:
            err(f"api/v1/tags.json: tag '{name}' post_count must be a positive integer")
        archive = str(tag.get("archive_url", "")).replace(ORIGIN, "")
        if archive and not (site_path_for(archive) / "index.html").exists():
            err(f"api/v1/tags.json: tag '{name}' archive page missing from build: {tag.get('archive_url')}")


def check_site_info():
    data = load_json("api/v1/site.json")
    if data is None:
        return
    if data.get("api_version") != "v1" or data.get("kind") != "site_info":
        err("api/v1/site.json: envelope must have api_version=v1 and kind=site_info")
    for field in ("name", "description", "url", "author", "counts", "endpoints", "policies"):
        if not data.get(field):
            err(f"api/v1/site.json: missing {field}")
    for group in ("endpoints", "policies"):
        for key, url in dict(data.get(group, {})).items():
            local = str(url).replace(ORIGIN, "")
            target = site_path_for(local)
            if not (target.exists() or (target / "index.html").exists()):
                err(f"api/v1/site.json: {group}.{key} points at missing path {url}")


def check_404_error_document(spec):
    """The 404 page must be short and embed the ErrorDocument JSON the spec promises."""
    not_found = SITE / "404.html"
    if not not_found.exists():
        return
    text = not_found.read_text(encoding="utf-8")

    # The page keeps the full site chrome by design; the cap only guards
    # against runaway bloat that would bury the machine-readable error block.
    if len(text.encode("utf-8")) > 100000:
        err(f"404.html: body is {len(text.encode('utf-8'))} bytes; keep it under 100KB so agents get a usable recovery page")

    match = re.search(
        r'<script type="application/json" id="agent-error">\s*(\{.*?\})\s*</script>',
        text,
        re.DOTALL,
    )
    if not match:
        err("404.html: missing embedded <script type=\"application/json\" id=\"agent-error\"> error object")
        return
    try:
        document = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        err(f"404.html: embedded agent-error JSON is invalid ({exc})")
        return

    error_schema = (
        spec.get("components", {}).get("schemas", {}).get("ErrorDocument", {})
        if spec
        else {}
    )
    if not error_schema:
        err("openapi.json: ErrorDocument schema is missing from components.schemas")
    error = document.get("error", {})
    for field in ("code", "status", "message", "resolution", "links"):
        if field not in error:
            err(f"404.html: embedded agent-error object missing error.{field}")
    if error.get("status") != 404 or error.get("code") != "not_found":
        err("404.html: embedded agent-error must have code=not_found and status=404")
    for key, url in dict(error.get("links", {})).items():
        local = str(url).replace(ORIGIN, "")
        target = site_path_for(local)
        if not (target.exists() or (target / "index.html").exists()):
            err(f"404.html: agent-error links.{key} points at missing path {url}")


def check_discovery_files():
    catalog = load_json(".well-known/api-catalog")
    if catalog is not None and "/openapi.json" not in json.dumps(catalog):
        err(".well-known/api-catalog: must advertise /openapi.json")

    llms = SITE / "llms.txt"
    if not llms.exists():
        err("llms.txt: missing from build output")
    else:
        text = llms.read_text(encoding="utf-8")
        for needle in ("## When to use this site", "/openapi.json", "/api/v1/posts.json"):
            if needle not in text:
                err(f"llms.txt: missing '{needle}'")

    not_found = SITE / "404.html"
    if not not_found.exists():
        err("404.html: missing from build output")
    else:
        text = not_found.read_text(encoding="utf-8")
        for needle in ("/llms.txt", "/sitemap.xml", "/search.json", "/openapi.json"):
            if needle not in text:
                err(f"404.html: missing recovery link to {needle}")


def main():
    if not SITE.exists():
        print("error: _site/ not found - run `bundle exec jekyll build` first", file=sys.stderr)
        return 2

    spec = load_json("openapi.json")
    if spec is not None:
        check_openapi(spec)
        check_search(spec)
    check_collection("api/v1/posts.json", "posts", "post_list")
    check_collection("api/v1/books.json", "books", "book_list")
    check_tags()
    check_site_info()
    check_404_error_document(spec)
    check_discovery_files()

    if errors:
        print("API output validation failed:", file=sys.stderr)
        for message in errors:
            print(f"- {message}", file=sys.stderr)
        return 1

    print("API output validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
