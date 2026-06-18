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

    return frontMatter.join("\n") + "\n\n## Loop\n\n" + instructions + "\n";
  }

  function loopTitle(loop) {
    return (loop.title || "Automation loop").trim();
  }

  function normalizeInstructions(instructions) {
    return (instructions || "").trim() || "Run the loop using the contract above. Collect proof before stopping.";
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
    if (present(loop.sourceTitle) || present(loop.sourceUrl)) {
      rows.push("- Source: " + (loop.sourceTitle || loop.sourceUrl) + (loop.sourceUrl ? " (" + loop.sourceUrl + ")" : ""));
    }
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

  function buildSkill(loop) {
    var slug = loopSlug(loop);
    var metadata = [
      "  marketplace_url: " + yamlString(window.location.href.split("#")[0])
    ];
    if (present(loop.sourceTitle)) metadata.push("  source_title: " + yamlString(loop.sourceTitle));
    if (present(loop.sourceUrl)) metadata.push("  source_url: " + yamlString(loop.sourceUrl));
    if (present(loop.attribution)) metadata.push("  attribution: " + yamlString(loop.attribution));

    var lines = [
      "---",
      "name: " + yamlString(slug),
      "description: " + yamlString(skillDescription(loop)),
      "disable-model-invocation: true",
      "metadata:",
    ].concat(metadata).concat([
      "---",
      "",
      "# " + loopTitle(loop),
      "",
      "Use this skill to run the automation loop below. Confirm it matches the user's task before taking action.",
      "",
      "## Procedure",
      "",
      normalizeInstructions(loop.instructions)
    ]);

    var details = detailRows(loop);
    var attribution = attributionRows(loop);

    if (details.length > 0) {
      lines.push("", "## Optional Details", "");
      details.forEach(function(row) {
        lines.push("- " + row[0] + ": " + row[1]);
      });
    }

    if (attribution.length > 0) {
      lines.push("", "## Links and Attribution", "");
      Array.prototype.push.apply(lines, attribution);
    }

    return lines.join("\n");
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

  function platformLabel(button) {
    var label = button.querySelector("strong");
    return label ? label.textContent.trim() : button.textContent.trim();
  }

  function exportText(kind, loop) {
    if (kind === "skill") return buildSkill(loop);
    if (kind === "agents") return buildAgentsBlock(loop);
    if (kind === "cursor") return buildCursorRule(loop);
    return buildLoopPrompt(loop);
  }

  function extensionForKind(kind) {
    if (kind === "cursor") return ".mdc";
    return ".md";
  }

  function filenameForKind(kind, loop) {
    if (kind === "skill") return "SKILL.md";
    return loopSlug(loop) + extensionForKind(kind);
  }

  function deepLink(kind, loop) {
    var prompt = buildLoopPrompt(loop);
    var promptText = encodeURIComponent(prompt);

    if (kind === "claude") {
      if (prompt.length > 5000) {
        return {
          error: "Claude deep links support prompts up to 5,000 characters. Copy the prompt instead."
        };
      }

      return {
        url: "claude-cli://open?q=" + promptText,
        message: "Opening Claude with a prompt preview. Review it before running."
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
        error: "Cursor deep links support URLs up to 8,000 characters. Copy or download the export instead."
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

  function downloadText(filename, text) {
    var blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  function showGenerated(markdown, note) {
    var panel = byId("loop-generated");
    var textarea = byId("loop-generated-markdown");
    var noteEl = byId("loop-generated-note");

    if (!panel || !textarea) return;
    textarea.value = markdown;
    panel.hidden = false;
    if (noteEl) noteEl.textContent = note || "";
  }

  function initLoopMarketplace() {
    var search = byId("loop-search");
    var category = byId("loop-category");
    var form = byId("loop-submit-form");
    var preview = byId("loop-preview-button");
    var root = document.querySelector(".loop-marketplace");

    if (search) search.addEventListener("input", updateFilters);
    if (category) category.addEventListener("change", updateFilters);

    if (preview && form) {
      preview.addEventListener("click", function() {
        showGenerated(buildMarkdown(form), "Preview generated. Submit creates a Markdown loop in the automation collection.");
      });
    }

    if (form && root) {
      form.addEventListener("submit", function(event) {
        event.preventDefault();

        if (form.elements.company && form.elements.company.value) return;
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        var markdown = buildMarkdown(form);
        var title = new FormData(form).get("title") || "Submitted loop";
        var filename = slugify(title) + ".md";
        var params = new URLSearchParams({
          filename: filename,
          value: markdown,
          message: "Add loop: " + title
        });
        var url = root.getAttribute("data-github-new-url") + "?" + params.toString();

        showGenerated(markdown, "Opening GitHub to create _loops/" + filename + " in the automation collection.");

        if (url.length > 7000) {
          byId("loop-generated-note").textContent = "This loop is long. Copy the Markdown into _loops/" + filename + " and open a pull request.";
          return;
        }

        window.open(url, "_blank", "noopener");
      });
    }

    var loop = readLoopData();
    if (loop) {
      document.querySelectorAll("[data-loop-export]").forEach(function(button) {
        button.addEventListener("click", function() {
          var kind = button.getAttribute("data-loop-export");
          copyText(exportText(kind, loop))
            .then(function() {
              setExportStatus("Copied " + platformLabel(button) + " instructions.");
            })
            .catch(function() {
              showExportFallback(exportText(kind, loop));
              setExportStatus("Copy blocked by the browser. Select the instructions below to copy them manually.");
            });
        });
      });

      document.querySelectorAll("[data-loop-download]").forEach(function(button) {
        button.addEventListener("click", function() {
          var kind = button.getAttribute("data-loop-download");
          downloadText(filenameForKind(kind, loop), exportText(kind, loop));
          if (kind === "skill") {
            setExportStatus("Downloaded SKILL.md. Place it in a folder named " + loopSlug(loop) + " under .agents/skills, .claude/skills, or .cursor/skills.");
          } else {
            setExportStatus("Downloaded " + filenameForKind(kind, loop) + ". Place it under .cursor/rules/.");
          }
        });
      });

      document.querySelectorAll("[data-loop-open]").forEach(function(button) {
        button.addEventListener("click", function() {
          var link = deepLink(button.getAttribute("data-loop-open"), loop);

          if (link.error) {
            setExportStatus(link.error);
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
