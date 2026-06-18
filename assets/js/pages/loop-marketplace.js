(function() {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "submitted-loop";
  }

  function yamlString(value) {
    return JSON.stringify((value || "").trim());
  }

  function present(value) {
    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
  }

  function parseTags(value) {
    return (value || "")
      .split(",")
      .map(function(tag) { return tag.trim(); })
      .filter(Boolean);
  }

  function deriveExcerpt(instructions) {
    var text = (instructions || "")
      .replace(/^#+\s+/gm, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "Community-submitted automation loop.";
    if (text.length <= 220) return text;
    return text.slice(0, 219).replace(/\s+\S*$/g, "") + ".";
  }

  function buildMarkdown(form) {
    var data = new FormData(form);
    var title = data.get("title") || "Submitted loop";
    var tags = parseTags(data.get("tags"));
    var instructions = (data.get("instructions") || "").trim();
    var excerpt = (data.get("excerpt") || "").trim() || deriveExcerpt(instructions);

    var frontMatter = [
      "---",
      "layout: loop",
      "title: " + yamlString(title),
      "excerpt: " + yamlString(excerpt),
      "status: submitted"
    ];

    if (tags.length > 0) {
      frontMatter.push("tags:");
      tags.forEach(function(tag) {
        frontMatter.push("  - " + yamlString(tag));
      });
    }

    frontMatter.push("---");

    return frontMatter.join("\n") + "\n\n" + instructions + "\n";
  }

  function buildSubmissionIssueBody(filename, markdown) {
    return [
      "This issue was generated from the Awesome Loops submission form.",
      "",
      "Target file: `_loops/" + filename + "`",
      "",
      "<!-- LOOP_SUBMISSION_FILENAME: " + filename + " -->",
      "<!-- LOOP_SUBMISSION_MARKDOWN_START -->",
      markdown.trim(),
      "<!-- LOOP_SUBMISSION_MARKDOWN_END -->",
      "",
      "A repository workflow can turn this issue into a reviewable PR."
    ].join("\n");
  }

  function loopTitle(loop) {
    return (loop.title || "Automation loop").trim();
  }

  function normalizeInstructions(instructions) {
    var text = (instructions || "").trim().replace(/^##\s+Loop\s*/i, "").trim();
    return text || "Run the loop using the contract above. Collect proof before stopping.";
  }

  function loopSlug(loop) {
    var raw = loop.slug || loopTitle(loop);
    var slug = slugify(raw).slice(0, 64).replace(/-+$/g, "");
    return slug || "automation-loop";
  }

  function compactText(value, fallback, limit) {
    var text = (value || fallback || "").replace(/\s+/g, " ").trim();
    if (text.length <= limit) return text;
    return text.slice(0, limit - 1).replace(/\s+\S*$/g, "") + ".";
  }

  function skillDescription(loop) {
    return compactText(
      loop.excerpt || "Run this reviewed automation loop.",
      "Run this reviewed automation loop.",
      900
    );
  }

  function detailRows(loop) {
    return [
      ["Category", loop.category],
      ["Trigger", loop.trigger],
      ["Cadence", loop.cadence],
      ["Tooling", loop.tooling],
      ["Proof", loop.proof],
      ["Stop condition", loop.stop],
      ["Memory", loop.memory]
    ].filter(function(row) {
      return present(row[1]);
    });
  }

  function attributionRows(loop) {
    var rows = [];
    if (present(loop.attribution)) rows.push("- Attribution: " + loop.attribution);
    (loop.links || []).forEach(function(link) {
      if (present(link.url)) rows.push("- " + (link.title || link.url) + ": " + link.url);
    });
    return rows;
  }

  function buildLoopPrompt(loop) {
    var lines = [
      "# " + loopTitle(loop),
      "",
      loop.excerpt || "",
      "",
      "## Instructions",
      normalizeInstructions(loop.instructions)
    ];
    var details = detailRows(loop);
    var attribution = attributionRows(loop);

    if (details.length > 0) {
      lines.push("", "## Details");
      details.forEach(function(row) {
        lines.push("- " + row[0] + ": " + row[1]);
      });
    }

    if (attribution.length > 0) {
      lines.push("", "## Links and Attribution");
      Array.prototype.push.apply(lines, attribution);
    }

    return lines.join("\n").trim() + "\n";
  }

  function buildAgentsBlock(loop) {
    var lines = [
      "## Automation loop: " + loopTitle(loop),
      "",
      "Use this loop when the task matches this workflow.",
      ""
    ];
    if (present(loop.trigger)) lines.splice(2, 1, "Use this loop when: " + loop.trigger + ".");
    if (present(loop.proof)) lines.push("Before stopping, collect this proof: " + loop.proof + ".", "");
    lines.push(buildLoopPrompt(loop));
    return lines.join("\n");
  }

  function buildCursorRule(loop) {
    return [
      "---",
      "description: " + yamlString(skillDescription(loop)),
      "alwaysApply: false",
      "---",
      "",
      buildLoopPrompt(loop)
    ].join("\n");
  }

  function readLoopData() {
    var node = byId("loop-export-data");
    if (!node) return null;

    try {
      return JSON.parse(node.textContent);
    } catch (error) {
      return null;
    }
  }

  function setExportStatus(message) {
    var status = byId("loop-export-status");
    if (status) status.textContent = message;
  }

  function setSubmitNote(message) {
    var note = byId("loop-submit-note");
    if (note) note.textContent = message;
  }

  function deepLink(kind, loop) {
    var prompt = buildLoopPrompt(loop);
    var promptText = encodeURIComponent(prompt);

    if (kind === "claude") {
      var claudeUrl = "https://claude.ai/new?q=" + promptText;
      if (claudeUrl.length > 8000) {
        return {
          fallbackText: prompt,
          error: "This loop is too long for a Claude launch URL. Copy the prompt below instead."
        };
      }

      return {
        url: claudeUrl,
        message: "Opening Claude with the loop loaded. Review it before running."
      };
    }

    if (kind === "codex") {
      var codexUrl = "https://chatgpt.com/?q=" + promptText;
      if (codexUrl.length > 8000) {
        return {
          fallbackText: buildAgentsBlock(loop),
          error: "This loop is too long for an OpenAI launch URL. Copy the Codex instructions below instead."
        };
      }

      return {
        url: codexUrl,
        message: "Opening OpenAI with Codex-ready instructions. Review them before running."
      };
    }

    if (kind === "cursor-prompt") {
      return cursorDeepLink("prompt", "", prompt);
    }

    if (kind === "cursor-rule") {
      return cursorDeepLink("rule", loopSlug(loop), buildCursorRule(loop));
    }

    return { error: "Unknown export action." };
  }

  function cursorDeepLink(type, name, text) {
    var query = new URLSearchParams();
    if (name) query.set("name", name);
    query.set("text", text);

    var url = "cursor://anysphere.cursor-deeplink/" + type + "?" + query.toString();
    if (url.length > 8000) {
      return {
        fallbackText: text,
        error: "This Cursor rule is too long for a launch URL. Copy the rule below instead."
      };
    }

    return {
      url: url,
      message: "Opening Cursor with a review step. Nothing runs until you confirm it."
    };
  }

  function legacyCopyText(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    var ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok ? Promise.resolve() : Promise.reject(new Error("copy failed"));
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function() {
        return legacyCopyText(text);
      });
    }

    return legacyCopyText(text);
  }

  function showExportFallback(text) {
    var status = byId("loop-export-status");
    if (!status) return;

    var textarea = byId("loop-export-fallback");
    if (!textarea) {
      textarea = document.createElement("textarea");
      textarea.id = "loop-export-fallback";
      textarea.className = "loop-export-fallback";
      textarea.setAttribute("readonly", "");
      textarea.rows = 6;
      status.insertAdjacentElement("afterend", textarea);
    }

    textarea.value = text;
    textarea.hidden = false;
    textarea.focus();
    textarea.select();
  }

  function updateFilters() {
    var search = (byId("loop-search") || {}).value || "";
    var category = (byId("loop-category") || {}).value || "";
    var query = search.trim().toLowerCase();
    var cards = Array.prototype.slice.call(document.querySelectorAll(".loop-card"));
    var visible = 0;

    cards.forEach(function(card) {
      var textMatch = !query || (card.getAttribute("data-search") || "").indexOf(query) !== -1;
      var categoryMatch = !category || card.getAttribute("data-category") === category;
      var show = textMatch && categoryMatch;
      card.hidden = !show;
      if (show) visible += 1;
    });

    var count = byId("loop-count");
    if (count) count.textContent = visible + (visible === 1 ? " loop" : " loops");
  }

  function updateSubmissionMarkdown(form) {
    var markdownNode = byId("loop-markdown-preview");

    if (markdownNode) markdownNode.textContent = buildMarkdown(form);
  }

  function setSubmitTab(name) {
    var formPanel = byId("loop-form-panel");
    var markdownPanel = byId("loop-markdown-panel");

    document.querySelectorAll("[data-loop-submit-tab]").forEach(function(button) {
      var selected = button.getAttribute("data-loop-submit-tab") === name;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
    });

    if (formPanel) formPanel.hidden = name !== "form";
    if (markdownPanel) markdownPanel.hidden = name !== "markdown";
  }

  function initLoopMarketplace() {
    var search = byId("loop-search");
    var category = byId("loop-category");
    var form = byId("loop-submit-form");
    var root = document.querySelector(".loop-marketplace");

    if (search) search.addEventListener("input", updateFilters);
    if (category) category.addEventListener("change", updateFilters);

    if (form) {
      form.addEventListener("input", function() {
        updateSubmissionMarkdown(form);
      });
      updateSubmissionMarkdown(form);
    }

    document.querySelectorAll("[data-loop-submit-tab]").forEach(function(button) {
      button.addEventListener("click", function() {
        setSubmitTab(button.getAttribute("data-loop-submit-tab"));
      });
    });

    if (form && root) {
      form.addEventListener("submit", function(event) {
        event.preventDefault();

        if (form.elements.company && form.elements.company.value) return;
        if (!form.checkValidity()) {
          setSubmitTab("form");
          requestAnimationFrame(function() {
            form.reportValidity();
          });
          return;
        }

        var markdown = buildMarkdown(form);
        var title = new FormData(form).get("title") || "Submitted loop";
        var filename = slugify(title) + ".md";
        var issueBody = buildSubmissionIssueBody(filename, markdown);
        var issueUrl = root.getAttribute("data-github-issue-url");
        var params = new URLSearchParams({
          title: "Loop submission: " + title,
          body: issueBody,
          labels: "loop-submission"
        });
        var url = issueUrl + "?" + params.toString();

        setSubmitNote("Opening GitHub to create a loop submission issue.");

        if (url.length > 7000) {
          var shortUrl = issueUrl + "?" + new URLSearchParams({
            title: "Loop submission: " + title,
            labels: "loop-submission"
          }).toString();
          copyText(issueBody)
            .then(function() {
              setSubmitNote("This loop is long, so the issue body was copied. Paste it into the GitHub issue.");
              window.open(shortUrl, "_blank", "noopener");
            })
            .catch(function() {
              setSubmitNote("This loop is too long for a GitHub URL. Shorten it or create an issue manually.");
            });
          return;
        }

        window.open(url, "_blank", "noopener");
      });
    }

    var loop = readLoopData();
    if (loop) {
      document.querySelectorAll("[data-loop-copy]").forEach(function(button) {
        button.addEventListener("click", function() {
          var prompt = buildLoopPrompt(loop);
          copyText(prompt)
            .then(function() {
              setExportStatus("Copied loop instructions.");
            })
            .catch(function() {
              showExportFallback(prompt);
              setExportStatus("Copy was blocked by the browser. Select the instructions below to copy them manually.");
            });
        });
      });

      document.querySelectorAll("[data-loop-open]").forEach(function(button) {
        button.addEventListener("click", function() {
          var link = deepLink(button.getAttribute("data-loop-open"), loop);
          var menu = button.closest("details");
          if (menu) menu.removeAttribute("open");

          if (link.error) {
            setExportStatus(link.error);
            if (link.fallbackText) showExportFallback(link.fallbackText);
            return;
          }

          setExportStatus(link.message);
          window.location.href = link.url;
        });
      });
    }

    updateFilters();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLoopMarketplace);
  } else {
    initLoopMarketplace();
  }
})();
