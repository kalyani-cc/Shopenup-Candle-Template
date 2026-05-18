type StarRatingProps = {
  value: number;
  max?: number;
  size?: "sm" | "md";
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
};

export function StarRating({
  value,
  max = 5,
  size = "md",
  interactive,
  onChange,
  className,
}: StarRatingProps) {
  const rounded = Math.min(max, Math.max(0, Math.round(value)));

  return (
    <span
      className={[
        "lumin-rating-stars",
        size === "sm" ? "lumin-rating-stars--sm" : "",
        interactive ? "lumin-rating-stars--interactive" : "",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      role={interactive ? "group" : "img"}
      aria-label={interactive ? "Rating" : `Rated ${rounded} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const on = star <= rounded;
        if (interactive && onChange) {
          return (
            <button
              key={star}
              type="button"
              className={[
                "lumin-rating-stars__star",
                "lumin-rating-stars__btn",
                on ? "is-on" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onChange(star)}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
            >
              ★
            </button>
          );
        }
        return (
          <span
            key={star}
            className={["lumin-rating-stars__star", on ? "is-on" : ""].filter(Boolean).join(" ")}
            aria-hidden="true"
          >
            ★
          </span>
        );
      })}
    </span>
  );
}
