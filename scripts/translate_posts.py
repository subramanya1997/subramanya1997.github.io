#!/usr/bin/env python3
"""
Translate blog posts to multiple languages using Claude 4.5 Sonnet.
Implements smart caching via content hashing to avoid unnecessary API calls.
Supports parallel execution for faster processing with rate limit handling.

Features:
- Smart content hashing to skip unchanged translations
- Parallel execution with configurable concurrency
- Automatic retry with exponential backoff for rate limits
- Beautiful progress bars and stats using Rich library
- Per-language breakdown and cache analysis

Usage:
    python scripts/translate_posts.py                        # Translate all posts to all languages
    python scripts/translate_posts.py --force                # Force retranslate everything
    python scripts/translate_posts.py --post "post-slug.md"  # Translate specific post
    python scripts/translate_posts.py --lang es              # Only translate to Spanish
    python scripts/translate_posts.py --dry-run              # Show what would be translated
    python scripts/translate_posts.py --concurrency 10       # Run 10 translations in parallel
    python scripts/translate_posts.py --max-retries 10       # Retry up to 10 times on failure
    python scripts/translate_posts.py --retry-delay 10       # Start with 10s retry delay
"""

import argparse
import asyncio
import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import anthropic
import yaml
from dotenv import load_dotenv
from pydantic import BaseModel
from tqdm.asyncio import tqdm
import threading

# Load environment variables from .env file
load_dotenv(Path(__file__).parent.parent / ".env")

# Rate limit settings
MAX_RETRIES = 5
INITIAL_RETRY_DELAY = 5  # seconds
MAX_RETRY_DELAY = 300  # 5 minutes

# Supported languages with their native names
SUPPORTED_LANGUAGES = {
    "es": {"name": "Spanish", "native": "Español"},
    "zh": {"name": "Chinese", "native": "中文"},
    "hi": {"name": "Hindi", "native": "हिन्दी"},
    "pt": {"name": "Portuguese", "native": "Português"},
    "fr": {"name": "French", "native": "Français"},
    "de": {"name": "German", "native": "Deutsch"},
    "ja": {"name": "Japanese", "native": "日本語"},
    "ko": {"name": "Korean", "native": "한국어"},
}

# Model to use for translations
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
POSTS_DIR = PROJECT_ROOT / "_posts"
TRANSLATIONS_DIR = PROJECT_ROOT / "assets" / "translations"
ERROR_LOG_FILE = PROJECT_ROOT / "scripts" / "translation_errors.log"


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Translate blog posts to multiple languages using Claude 4.5 Sonnet.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scripts/translate_posts.py                    # Translate all posts to all languages
    python scripts/translate_posts.py --force            # Force retranslate everything
    python scripts/translate_posts.py --post "2026-01-01-what-are-context-graphs-really.md"
    python scripts/translate_posts.py --lang es          # Only translate to Spanish
    python scripts/translate_posts.py --dry-run          # Show what would be translated
        """,
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force retranslation even if cached translation exists",
    )
    parser.add_argument(
        "--post",
        type=str,
        help="Translate only a specific post (filename or slug)",
    )
    parser.add_argument(
        "--lang",
        type=str,
        choices=list(SUPPORTED_LANGUAGES.keys()),
        help="Translate to a specific language only",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be translated without making API calls",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose output",
    )
    parser.add_argument(
        "--concurrency",
        "-c",
        type=int,
        default=5,
        help="Number of parallel translation requests (default: 5)",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=5,
        help="Maximum number of retries for failed requests (default: 5)",
    )
    parser.add_argument(
        "--retry-delay",
        type=int,
        default=5,
        help="Initial retry delay in seconds (default: 5)",
    )
    return parser.parse_args()


def parse_front_matter(content: str) -> tuple[dict, str]:
    """
    Parse YAML front matter and body from markdown content.
    
    Returns:
        Tuple of (front_matter_dict, body_content)
    """
    # Match YAML front matter between --- delimiters
    front_matter_pattern = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
    match = front_matter_pattern.match(content)
    
    if not match:
        raise ValueError("No valid YAML front matter found in content")
    
    front_matter_yaml = match.group(1)
    body = content[match.end():]
    
    try:
        front_matter = yaml.safe_load(front_matter_yaml)
    except yaml.YAMLError as e:
        raise ValueError(f"Failed to parse YAML front matter: {e}")
    
    return front_matter, body


def calculate_content_hash(content: str) -> str:
    """Calculate SHA256 hash of content for caching."""
    return f"sha256:{hashlib.sha256(content.encode('utf-8')).hexdigest()}"


def log_error_to_file(slug: str, lang: str, error: Exception, response_snippet: str = ""):
    """Log detailed error information to error log file."""
    try:
        import traceback
        timestamp = datetime.now().isoformat()
        with open(ERROR_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*80}\n")
            f.write(f"Timestamp: {timestamp}\n")
            f.write(f"Post: {slug}\n")
            f.write(f"Language: {lang}\n")
            f.write(f"Error Type: {type(error).__name__}\n")
            f.write(f"Error Message: {str(error)}\n")
            if response_snippet:
                f.write(f"Response Snippet:\n{response_snippet[:500]}\n")
            f.write(f"\nFull Traceback:\n")
            f.write(traceback.format_exc())
            f.write(f"\n{'='*80}\n")
    except Exception as e:
        # Don't let logging errors crash the script
        print(f"Warning: Failed to write to error log: {e}")


def get_post_slug(filename: str) -> str:
    """Extract slug from post filename (removes date prefix and .md extension)."""
    # e.g., "2026-01-01-what-are-context-graphs-really.md" -> "what-are-context-graphs-really"
    name = filename.replace(".md", "")
    # Remove date prefix (YYYY-MM-DD-)
    parts = name.split("-", 3)
    if len(parts) >= 4 and parts[0].isdigit():
        return parts[3]
    return name


def get_cached_translation(lang: str, slug: str) -> Optional[dict]:
    """Load cached translation if it exists."""
    translation_path = TRANSLATIONS_DIR / lang / f"{slug}.json"
    if translation_path.exists():
        try:
            with open(translation_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None
    return None


def should_translate(
    lang: str,
    slug: str,
    content_hash: str,
    force: bool = False,
) -> tuple[bool, str]:
    """
    Determine if a post needs translation.
    
    Returns:
        Tuple of (should_translate, reason)
    """
    if force:
        return True, "forced retranslation"
    
    cached = get_cached_translation(lang, slug)
    
    if cached is None:
        return True, "no cached translation"
    
    cached_hash = cached.get("source_hash", "")
    if cached_hash != content_hash:
        return True, f"content changed (hash mismatch)"
    
    return False, "cached translation up to date"


def build_translation_messages(
    title: str,
    excerpt: str,
    body: str,
    target_language: str,
    target_native: str,
) -> tuple[str, list[dict]]:
    """Build the translation messages for Claude with structured output."""
    system_prompt = """You are a professional translator.

CRITICAL: You MUST respond with valid JSON only, no markdown, no explanations, just pure JSON.

Output Format (JSON):
{
  "title": "translated title",
  "excerpt": "translated excerpt",
  "content_html": "translated content as HTML"
}

Rules:
- Preserve all markdown formatting, code blocks, and HTML tags exactly
- Keep technical terms, proper nouns, and code in English
- Maintain the author's voice and writing style
- Translate naturally, not literally
- Keep URLs and image paths unchanged
- Preserve reference links [1], [2], etc. exactly as they appear
- Convert markdown to HTML for the content_html field
- Return ONLY valid JSON, nothing else"""

    user_message = f"""Translate this blog post to {target_language} ({target_native}) and return ONLY valid JSON:

TITLE: {title}

EXCERPT: {excerpt}

CONTENT:
{body}

Remember: Return ONLY valid JSON with "title", "excerpt", and "content_html" fields. No markdown, no explanations."""

    messages = [
        {"role": "user", "content": user_message},
    ]
    
    return system_prompt, messages


# Pydantic model for structured output (required for streaming API)
class TranslationOutput(BaseModel):
    """Structured output model for translations."""
    title: str
    excerpt: str
    content_html: str


async def translate_with_claude_async(
    client: anthropic.AsyncAnthropic,
    title: str,
    excerpt: str,
    body: str,
    lang_code: str,
    max_retries: int = MAX_RETRIES,
    initial_delay: int = INITIAL_RETRY_DELAY,
    verbose: bool = False,
) -> dict:
    """Translate content using Claude API with streaming and structured outputs (async version).
    
    Uses streaming API to support long-running translations (>10 minutes).
    """
    lang_info = SUPPORTED_LANGUAGES[lang_code]
    system_prompt, messages = build_translation_messages(
        title=title,
        excerpt=excerpt,
        body=body,
        target_language=lang_info["name"],
        target_native=lang_info["native"],
    )
    
    retry_delay = initial_delay
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            # Use streaming API for long-running operations (>10 minutes)
            # Using structured outputs to guarantee valid JSON responses
            async with client.beta.messages.stream(
                model=CLAUDE_MODEL,
                max_tokens=50000,  # Increased for very long posts
                temperature=0,  # Deterministic output for consistent translations
                betas=["structured-outputs-2025-11-13"],
                system=system_prompt,
                messages=messages,
                output_format=TranslationOutput,  # Pass Pydantic model directly for streaming
                service_tier="auto",  # Auto-select service tier for better performance and reliability
            ) as stream:
                message = await stream.get_final_message()
            
            # Check for refusal
            if message.stop_reason == "refusal":
                raise ValueError("Claude refused to translate this content")
            
            # Check if response was truncated due to token limit
            if message.stop_reason == "max_tokens":
                raise ValueError("Response truncated due to max_tokens limit - increase max_tokens or reduce content")
            
            # Parse and validate the structured JSON response with Pydantic
            response_text = message.content[0].text
            try:
                parsed = TranslationOutput.model_validate_json(response_text)
                result = parsed.model_dump()
            except Exception as json_error:
                # Log the raw response snippet for debugging
                response_snippet = response_text[:500] if len(response_text) > 500 else response_text
                raise ValueError(f"Failed to parse translation JSON: {json_error}. Response snippet: {response_snippet}")
            
            return result
            
        except asyncio.TimeoutError:
            last_exception = TimeoutError(f"API request timed out after 600s")
            if attempt < max_retries - 1:
                if verbose:
                    print(f"    Request timed out. Retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, MAX_RETRY_DELAY)
            else:
                raise TimeoutError(f"API request timed out after {max_retries} attempts")
            
        except anthropic.RateLimitError as e:
            last_exception = e
            if attempt < max_retries - 1:
                if verbose:
                    print(f"    Rate limited. Retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, MAX_RETRY_DELAY)
            else:
                raise
                
        except anthropic.APIError as e:
            last_exception = e
            # Handle 499 (client closed request) and 5xx errors
            if attempt < max_retries - 1 and (hasattr(e, 'status_code') and (e.status_code >= 500 or e.status_code == 499)):
                if verbose:
                    status = getattr(e, 'status_code', 'unknown')
                    print(f"    API error (status {status}). Retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, MAX_RETRY_DELAY)
            else:
                raise
        
        except ValueError as e:
            # Handle truncated responses and JSON parsing errors
            last_exception = e
            error_str = str(e)
            if "max_tokens" in error_str or "truncated" in error_str:
                if attempt < max_retries - 1:
                    if verbose:
                        print(f"    Response truncated. Retrying in {retry_delay}s...")
                    await asyncio.sleep(retry_delay)
                    retry_delay = min(retry_delay * 2, MAX_RETRY_DELAY)
                else:
                    raise
            elif "Failed to parse translation JSON" in error_str:
                # JSON parsing error - retry as it might be a transient issue
                if attempt < max_retries - 1:
                    if verbose:
                        print(f"    JSON parsing error. Retrying in {retry_delay}s...")
                    await asyncio.sleep(retry_delay)
                    retry_delay = min(retry_delay * 2, MAX_RETRY_DELAY)
                else:
                    raise
            else:
                raise
                
        except Exception as e:
            raise
    
    raise last_exception or Exception("Failed after maximum retries")


def save_translation(
    lang: str,
    slug: str,
    translation: dict,
    source_hash: str,
) -> Path:
    """Save translation to JSON file."""
    # Ensure directory exists
    lang_dir = TRANSLATIONS_DIR / lang
    lang_dir.mkdir(parents=True, exist_ok=True)
    
    # Build output data
    output_data = {
        "title": translation["title"],
        "excerpt": translation["excerpt"],
        "content_html": translation["content_html"],
        "source_hash": source_hash,
        "model": CLAUDE_MODEL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # Write JSON file
    output_path = lang_dir / f"{slug}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    return output_path


def get_posts_to_translate(specific_post: Optional[str] = None) -> list[Path]:
    """Get list of post files to translate."""
    if specific_post:
        # Find the specific post
        for post_file in POSTS_DIR.glob("*.md"):
            if specific_post in post_file.name or specific_post == get_post_slug(post_file.name):
                return [post_file]
        print(f"Error: Post '{specific_post}' not found in {POSTS_DIR}")
        sys.exit(1)
    
    # Get all markdown files except readme.md
    posts = [
        p for p in sorted(POSTS_DIR.glob("*.md"))
        if p.name.lower() != "readme.md"
    ]
    return posts


async def translate_task(
    semaphore: asyncio.Semaphore,
    client: anthropic.AsyncAnthropic,
    slug: str,
    title: str,
    excerpt: str,
    body: str,
    lang: str,
    content_hash: str,
    pbar: tqdm,
    max_retries: int = MAX_RETRIES,
    retry_delay: int = INITIAL_RETRY_DELAY,
) -> dict:
    """Single translation task that respects concurrency limits."""
    lang_info = SUPPORTED_LANGUAGES[lang]
    
    async with semaphore:
        try:
            pbar.set_description(f"Translating {slug[:20]}... ({lang})")
            
            translation = await translate_with_claude_async(
                client=client,
                title=title,
                excerpt=excerpt,
                body=body,
                lang_code=lang,
                max_retries=max_retries,
                initial_delay=retry_delay,
                verbose=False,
            )
            
            # Save translation
            save_translation(
                lang=lang,
                slug=slug,
                translation=translation,
                source_hash=content_hash,
            )
            
            pbar.update(1)
            pbar.set_postfix_str(f"✓ {slug[:15]} ({lang})")
            
            # Wait 120 seconds before allowing next request to proceed
            await asyncio.sleep(120)
            
            return {"status": "success", "lang": lang, "slug": slug}
            
        except TimeoutError as e:
            error_msg = f"Timeout: {str(e)[:60]}"
            log_error_to_file(slug, lang, e)
            pbar.update(1)
            pbar.write(f"⏱ Timeout: {slug} ({lang})")
            return {"status": "failed", "lang": lang, "slug": slug, "error": error_msg}
            
        except anthropic.RateLimitError as e:
            error_msg = f"Rate limited: {str(e)[:60]}"
            log_error_to_file(slug, lang, e)
            pbar.update(1)
            pbar.write(f"⚠ Rate limited: {slug} ({lang})")
            return {"status": "failed", "lang": lang, "slug": slug, "error": error_msg}
            
        except anthropic.APIError as e:
            status_code = getattr(e, 'status_code', 'unknown')
            if status_code == 499:
                error_msg = f"Client closed request (499) - connection interrupted"
            else:
                error_msg = f"API error ({status_code}): {str(e)[:60]}"
            log_error_to_file(slug, lang, e)
            pbar.update(1)
            pbar.write(f"✗ API error ({status_code}): {slug} ({lang})")
            return {"status": "failed", "lang": lang, "slug": slug, "error": error_msg}
            
        except Exception as e:
            error_msg = str(e)[:60]
            response_snippet = getattr(e, 'response_snippet', '')
            log_error_to_file(slug, lang, e, response_snippet)
            pbar.update(1)
            pbar.write(f"✗ Error: {slug} ({lang}) - {type(e).__name__}")
            return {"status": "failed", "lang": lang, "slug": slug, "error": error_msg}


async def run_translations_async(args: argparse.Namespace):
    """Run translations asynchronously with concurrency control."""
    # Check for API key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key and not args.dry_run:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        print("Set it with: export ANTHROPIC_API_KEY='your-api-key'")
        sys.exit(1)
    
    # Initialize async Claude client
    client = None
    if not args.dry_run:
        client = anthropic.AsyncAnthropic(api_key=api_key)
    
    # Get target languages
    if args.lang:
        target_languages = [args.lang]
    else:
        target_languages = list(SUPPORTED_LANGUAGES.keys())
    
    # Get posts to translate
    posts = get_posts_to_translate(args.post)
    
    # Silently configure (no output before dashboard)
    
    # Collect all translation tasks
    tasks_to_run = []
    stats = {
        "total_posts": len(posts),
        "total_possible": 0,
        "to_translate": 0,
        "cached": 0,
        "skipped_not_ready": 0,
        "parse_errors": 0,
        "by_language": {lang: {"cached": 0, "to_translate": 0} for lang in target_languages},
    }
    
    # First pass: identify what needs translation (silent analysis)
    for post_path in posts:
            
            slug = get_post_slug(post_path.name)
            
            # Read and parse post content
            try:
                with open(post_path, "r", encoding="utf-8") as f:
                    raw_content = f.read()
                front_matter, body = parse_front_matter(raw_content)
            except Exception as e:
                if args.verbose:
                    print(f"! Error parsing {post_path.name}: {e}")
                stats["parse_errors"] += 1
                continue
            
            # Skip posts that aren't ready
            if not front_matter.get("ready", True):
                if args.verbose:
                    print(f"- Skipping {post_path.name} (not ready)")
                stats["skipped_not_ready"] += 1
                continue
            
            title = front_matter.get("title", "")
            excerpt = front_matter.get("excerpt", "")
            content_hash = calculate_content_hash(raw_content)
            
            for lang in target_languages:
                stats["total_possible"] += 1
                
                # Check if translation is needed
                needs_translation, reason = should_translate(
                    lang=lang,
                    slug=slug,
                    content_hash=content_hash,
                    force=args.force,
                )
                
                if not needs_translation:
                    stats["cached"] += 1
                    stats["by_language"][lang]["cached"] += 1
                    continue
                
                stats["to_translate"] += 1
                stats["by_language"][lang]["to_translate"] += 1
                
                if not args.dry_run:
                    # Add to tasks list
                    tasks_to_run.append({
                        "slug": slug,
                        "title": title,
                        "excerpt": excerpt,
                        "body": body,
                        "lang": lang,
                        "content_hash": content_hash,
                    })
    
    # Skip cache analysis output (will show in dashboard)
    
    if args.dry_run:
        print(f"\n🔍 Dry run - would translate {stats['to_translate']} posts (cached: {stats['cached']})")
        return
    
    if not tasks_to_run:
        print("\n✓ All translations are up to date!")
        return
    
    # Show summary
    print(f"\nTranslating {stats['to_translate']} posts to {len(target_languages)} languages")
    print(f"Cached: {stats['cached']} | New: {stats['to_translate']} | Total: {stats['total_possible']}")
    
    # Create semaphore for concurrency control
    semaphore = asyncio.Semaphore(args.concurrency)
    
    # Record start time
    start_time = datetime.now()
    
    # Create progress bar
    with tqdm(total=len(tasks_to_run), desc="Translating", unit="post", ncols=100) as pbar:
        # Create async tasks
        async_tasks = [
            translate_task(
                semaphore=semaphore,
                client=client,
                slug=task["slug"],
                title=task["title"],
                excerpt=task["excerpt"],
                body=task["body"],
                lang=task["lang"],
                content_hash=task["content_hash"],
                pbar=pbar,
                max_retries=args.max_retries,
                retry_delay=args.retry_delay,
            )
            for task in tasks_to_run
        ]
        
        # Run all tasks concurrently
        results = await asyncio.gather(*async_tasks, return_exceptions=True)
    
    # Calculate time taken
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    # Collect failed tasks
    failed_tasks = []
    successful = 0
    for result in results:
        if isinstance(result, Exception):
            failed_tasks.append({"error": str(result)})
        elif result.get("status") == "failed":
            failed_tasks.append(result)
        elif result.get("status") == "success":
            successful += 1
    
    failed = len(failed_tasks)
    
    # Print final summary
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Total posts: {stats['total_posts']}")
    print(f"  Cached: {stats['cached']} ({stats['cached']/stats['total_possible']*100:.1f}%)")
    print(f"  Newly translated: {successful}")
    if failed > 0:
        print(f"  Failed: {failed}")
    print(f"  Time taken: {duration:.1f}s")
    if successful > 0:
        print(f"  Avg per translation: {duration/successful:.1f}s")
    print(f"{'='*60}")
    
    # Show failures if any
    if failed > 0:
        print(f"\n⚠ {failed} translation(s) failed:")
        for task in failed_tasks[:5]:  # Show first 5 failures
            print(f"  ✗ [{task.get('lang', '?')}] {task.get('slug', 'unknown')}: {task.get('error', 'Unknown error')[:80]}")
        if len(failed_tasks) > 5:
            print(f"  ... and {len(failed_tasks) - 5} more")
        print(f"\nCheck scripts/translation_errors.log for details")
        sys.exit(1)
    else:
        print("\n✓ All translations completed successfully!")


def main():
    """Main function to orchestrate translations."""
    args = parse_args()
    asyncio.run(run_translations_async(args))


if __name__ == "__main__":
    main()
