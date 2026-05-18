"use client";

import { useId, useState } from "react";

const PREVIEW_LENGTH = 380;

type Props = {
  paragraphs: string[];
};

export function BlogPostDescription({ paragraphs }: Props) {
  const [expanded, setExpanded] = useState(false);
  const regionId = useId();

  const fullText = paragraphs.join("\n\n").trim();
  if (!fullText) {
    return null;
  }

  const needsToggle = fullText.length > PREVIEW_LENGTH;
  const previewText = needsToggle
    ? `${fullText.slice(0, PREVIEW_LENGTH).trimEnd()}...`
    : fullText;

  const visibleParagraphs =
    !needsToggle || expanded
      ? paragraphs
      : previewText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="lumin-blog-post-description">
      <div
        id={regionId}
        className="blog-single__content lumin-blog-post-prose mb-0"
        aria-expanded={needsToggle ? expanded : undefined}
      >
        {visibleParagraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {needsToggle ? (
        <p className="lumin-blog-post-read-more-wrap mb-0 mt-3">
          <button
            type="button"
            className="btn blog-item-2__content--btn lumin-blog-post-read-more-btn"
            aria-controls={regionId}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        </p>
      ) : null}
    </div>
  );
}
