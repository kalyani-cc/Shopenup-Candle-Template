type PageHeroProps = {
  title: string;
  subtitle?: string;
};

export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className="page-banner bg-light py-5">
      <div className="container-fluid custom-container">
        <h1 className="mb-2">{title}</h1>
        {subtitle ? <p className="mb-0">{subtitle}</p> : null}
      </div>
    </section>
  );
}
