/* eslint-disable @next/next/no-img-element -- plain <img> on purpose: lib/dither.js reads and
   redraws these images, and lib/loader.js tracks them for its progress counter */
import type { CSSProperties, ReactNode } from "react";
import SiteScripts from "@/components/SiteScripts";

const A = "/assets";

/* ---------------- content ---------------- */

const NAV = [
  { href: "#services", label: "Practice Areas" },
  { href: "#testimonials", label: "Results" },
  { href: "#about", label: "Attorneys" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#about", label: "About" },
  { href: "#faq", label: "Resources" },
  { href: "#contact", label: "Contact" },
];

const STATS = [
  { count: 800, suffix: "+", label: "Managed doors" },
  { count: 20, suffix: "+", label: "Years of experience" },
  { count: 150, prefix: "$", suffix: "M", label: "Revenue" },
];

type Service = {
  label: string;
  title: ReactNode;
  text: string;
  img: string;
  alt: string;
  // framed illustrations are positioned inside the visual box
  frame?: CSSProperties;
};

const SERVICES: Service[] = [
  {
    label: "Car Accidents",
    title: "When the Road Turns Against You",
    text: "Car accidents Rear-end crashes, intersection collisions, rideshare wrecks, and hit-and-runs. We deal with the insurer so you don’t have to.",
    img: "illustration-car-accident.svg",
    alt: "Illustration of two cars colliding beneath the scales of justice",
  },
  {
    label: "Truck & Commercial Vehicle Crashes",
    title: (<>Big Trucks.<br />Bigger Consequences.</>),
    text: "We take on 18-wheelers, delivery vans, and commercial fleets—and move quickly to preserve critical evidence.",
    img: "illustration-truck.svg",
    alt: "Isometric illustration of a box truck with a camera and accident report",
  },
  {
    label: "Slip, Trip & Fall",
    title: "When Someone Else's Neglect Hurts You",
    text: "From unsafe floors to broken stairs, we uncover what went wrong and who was responsible.",
    img: "illustration-slip-fall.svg",
    alt: "Isometric illustration of broken stairs, a wet floor and a warning cone",
    frame: { left: "-5.455%", top: "1.408%", width: "111.818%", height: "97.182%" },
  },
  {
    label: "Workplace Injuries",
    title: "Injured at Work? Look Beyond Your Employer.",
    text: "When a third party is responsible for your injury, we help uncover the liability others may overlook.",
    img: "illustration-workplace.svg",
    alt: "Isometric illustration of a forklift carrying boxes",
    frame: { left: "-5.682%", top: "-0.073%", width: "115.227%", height: "100.144%" },
  },
  {
    label: "Medical Malpractice",
    title: "When Medical Care Goes Wrong",
    text: "We investigate missed diagnoses, surgical errors, and birth injuries with independent medical experts.",
    img: "illustration-medical.svg",
    alt: "Isometric illustration of a hospital bed, heart monitor and medical chart",
    frame: { left: "-5.227%", top: "1.311%", width: "112.045%", height: "97.379%" },
  },
  {
    label: "Wrongful Death",
    title: "When Loss Was Caused by Negligence",
    text: "We help families pursue accountability and compensation for the financial and lasting impact of their loss.",
    img: "illustration-wrongful-death.svg",
    alt: "Isometric illustration of a memorial photo, candle and scales of justice",
    frame: { left: "-5.455%", top: "0.620%", width: "113.636%", height: "98.762%" },
  },
];

const STEPS = [
  {
    title: "Connect",
    kicker: "(Let's talk first)",
    text: "Tell us what happened A short call or form. We listen, ask the right questions, and say honestly if we can help.",
    chips: ["Share Your Story", "We Listen", "Honest Advice"],
  },
  {
    title: "Build",
    kicker: "(The foundation)",
    text: "We build the claim Medical records, liability, insurance limits, and lost wages. You get updates in plain English.",
    chips: ["Evidence", "Coverage", "Lost Wages"],
  },
  {
    title: "Resolve",
    kicker: "(The right outcome)",
    text: "We negotiate or file. Most cases settle. If the offer is low, we litigate. You approve settlements.",
    chips: ["Negotiate", "Litigate", "You Approve"],
    wide: true,
  },
];

type Testimonial = { col: number; row: number; img: string; name: string; meta: string; quote: ReactNode; narrow?: boolean };

// rows: 1 → cols 1, 3, 4 · 2 → cols 1, 2, 3 · 3 → cols 2, 3, 4
const TESTIMONIALS: Testimonial[] = [
  { col: 1, row: 1, img: "t-michel.png", name: "Michel ole", meta: "(Head Manager)", quote: "From our first talk, everything was clear. The team updated me and made it easier." },
  { col: 3, row: 1, img: "t-sarah.png", name: "Sarah M.", meta: "Sample · First consultation", quote: (<>They listened without rushing me<br />and explained my options<br />in plain English.</>) },
  { col: 4, row: 1, img: "t-emily.png", name: "Emily R.", meta: "Sample · Claim updates", quote: "They listened to what happened, explained my options in plain English, and kept me informed", narrow: true },
  { col: 1, row: 2, img: "t-jessica.png", name: "Jessica L.", meta: "Sample · Insurance support", quote: "Having help with the insurance calls gave me more time to focus on recovery." },
  { col: 2, row: 2, img: "t-olivia.png", name: "Olivia K.", meta: "Sample · Claim preparation", quote: "They made the paperwork manageable and explained what was needed at each step." },
  { col: 3, row: 2, img: "t-rachel.png", name: "Rachel T.", meta: "Sample · Clear guidance", quote: "My questions were welcome, and the answers were always easy to understand." },
  { col: 2, row: 3, img: "t-lauren.png", name: "Lauren D.", meta: "Sample · Settlement review", quote: (<>They explained the offer carefully<br />and left the final settlement<br />decision to me.</>) },
  { col: 3, row: 3, img: "t-megan.png", name: "Megan A.", meta: "Sample · Personal support", quote: "The team's accessibility stood out. I knew who to contact, what was next, and what decisions to make." },
  { col: 4, row: 3, img: "t-ashley.png", name: "Ashley B.", meta: "Sample · Next steps", quote: "They kept things organized and helped me understand what would happen next." },
];

const FAQS = [
  { q: "Do I pay anything to talk to you?", a: "No. Your initial case review is free. If we take your case, you do not pay an attorney fee unless we recover compensation for you." },
  { q: "How long do I have to file a claim?", a: "Deadlines depend on your state and the type of claim. Contact us early so we can confirm the deadline that applies to you." },
  { q: "What if I was partly at fault?", a: "You may still be able to recover compensation. We’ll review what happened and explain how shared fault could affect your claim." },
  { q: "Will my case go to court?", a: "Most cases settle. If the offer is low, we litigate — and you approve any settlement before it’s final." },
  { q: "What should I do right now?", a: "Get medical care, keep your records and receipts, and avoid giving the insurer a recorded statement before you talk to us." },
  { q: "What information should I bring?", a: "Bring what you have: photos, incident reports, medical records, and insurance letters. Don’t worry if it’s incomplete." },
  { q: "How much is my case worth?", a: "It depends on your injuries, costs, lost wages, and insurance limits. A free 10-minute review will explain your claim’s worth." },
  { q: "What if the insurer has contacted me?", a: "You can politely decline to discuss details until you’ve spoken with us. We deal with the insurer so you don’t have to." },
];

/* ---------------- small pieces ---------------- */

const DITHER_ART = '{"levels":3}';
const DITHER_MONO = '{"levels":8,"mono":true}';

function BtnIcon({ src, size = 14 }: { src: string; size?: number }) {
  return (
    <span className="btn__icon">
      <img src={`${A}/${src}`} width={size} height={size} alt="" />
    </span>
  );
}

function WindowDots({ className }: { className?: string }) {
  return <img className={className} src={`${A}/window-dots.svg`} width={42} height={10} alt="" />;
}

function ArtFx({ className = "fx fx--art" }: { className?: string }) {
  return (
    <div className={className} data-dither={DITHER_ART}>
      <img src={`${A}/gradient-texture.png`} alt="" />
    </div>
  );
}

function Stats({ variant, reveal }: { variant: "stack" | "row"; reveal?: boolean }) {
  return (
    <dl className={`stats stats--${variant}`} {...(reveal ? { "data-reveal": "" } : {})}>
      {STATS.map((s) => (
        <div key={s.label}>
          <dt data-count={s.count} data-prefix={s.prefix} data-suffix={s.suffix}>
            {(s.prefix ?? "") + s.count + s.suffix}
          </dt>
          <dd>{s.label}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------------- page ---------------- */

export default function Home() {
  return (
    <>
      {/* ============ INTRO LOADER (lib/loader.js) ============ */}
      <div className="loader" id="loader" role="status" aria-label="Loading">
        <canvas className="loader__canvas" aria-hidden="true"></canvas>
        <div className="loader__ui">
          <div className="loader__top">
            <span className="loader__brand"><span className="brand__legal">Legal</span> <span className="brand__compli">Compli</span></span>
            <span className="loader__label">Preparing your case review</span>
          </div>
          <div className="loader__bottom">
            <p className="loader__count"><span data-loader-count>0</span><span className="loader__pct">%</span></p>
            <p className="loader__tag">Injury law, explained in plain English.</p>
          </div>
          <div className="loader__track" aria-hidden="true"><span className="loader__bar" data-loader-bar></span></div>
        </div>
      </div>

      {/* ============ HEADER ============ */}
      <header className="site-header" id="top">
        <a href="#top" className="brand" aria-label="Legal Compli home">
          <span className="brand__legal">Legal</span><span className="brand__compli">Compli</span>
        </a>
        <nav className="site-nav" id="site-nav" aria-label="Main">
          {NAV.map((n) => <a key={n.label} href={n.href}>{n.label}</a>)}
        </nav>
        <div className="site-header__actions">
          <a href="#contact" className="btn btn--nav">
            <span>Free Review</span>
            <BtnIcon src="icon-signin.svg" />
          </a>
          <button className="nav-toggle" aria-controls="site-nav" aria-expanded="false" aria-label="Open menu">
            <span></span><span></span>
          </button>
        </div>
      </header>

      {/* GSAP ScrollSmoother: everything that scrolls lives in #smooth-content (header stays outside) */}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main>
            {/* ============ HERO ============ */}
            <section className="hero">
              <div className="hero__intro hero-content">
                <div className="hero__copy">
                  <h1 className="hero__title" data-reveal>In an accident? We manage the claim. Focus on recovery.</h1>
                  <p className="hero__lead" data-reveal><strong>Christina Malik</strong> helps those injured by negligence in car crashes, falls, and workplace incidents. You pay no fees unless we win.</p>
                </div>
                <a href="#contact" className="btn btn--dark" data-reveal>
                  <span>Book a Consultation</span>
                  <BtnIcon src="icon-caret-right.svg" />
                </a>
              </div>

              <div className="hero__band hero-image-wrapper">
                <img className="hero__landscape hero-image" src={`${A}/hero-landscape.png`} width={1199} height={672} alt="" data-parallax />
                <article className="profile-card" data-reveal-card>
                  <div className="profile-card__strip">
                    <ArtFx className="fx fx--strip-hero" />
                  </div>
                  <div className="profile-card__body">
                    <img className="profile-card__pattern" src={`${A}/card-pattern.svg`} width={501} height={449.5} alt="" />
                    <div className="profile-card__who">
                      <div className="avatar">
                        <div className="avatar__crop">
                          <img src={`${A}/christina-portrait.png`} alt="Christina Malik" />
                        </div>
                      </div>
                      <div>
                        <p className="profile-card__name">Christina Malik</p>
                        <p className="profile-card__role">Attorney &amp; Principal Consultant</p>
                      </div>
                    </div>
                    <Stats variant="stack" />
                  </div>
                </article>
              </div>
            </section>

            {/* ============ SERVICES ============ */}
            <section className="services" id="services">
              <header className="section-head section-head--center">
                <span className="badge" data-reveal>SERVICES</span>
                <h2 className="h2 services__title" data-reveal><span className="services__line">Tell us what happened.</span> <span className="services__line">We’ll tell you if you have a case.</span></h2>
                <p className="services__sub" data-reveal>Four to six cards. One sentence each. Link every card to its own page.</p>
              </header>

              {/* Stacked cards: wrapper → cards (sticky stage) → card-wrapper → card, then the scroll spacer.
                  lib/main.js upgrades this to the pinned, scroll-scrubbed stack (cards 02–06 wait behind card 01). */}
              <div className="stack" data-stack>
                <div className="stack__cards">
                  {SERVICES.map((s, i) => {
                    const num = String(i + 1).padStart(2, "0");
                    return (
                      <div className="stack__card-wrapper" style={{ "--i": i } as CSSProperties} key={s.label}>
                        <article className="stack-card" aria-labelledby={`svc-${num}`}>
                          <div className="stack-card__bar"><span className="num">{num}</span><span className="stack-card__label" id={`svc-${num}`}>{s.label}</span><WindowDots /></div>
                          <div className="stack-card__body">
                            <div className="stack-card__text">
                              <div className="stack-card__copy">
                                <h3 className="h3 stack-card__title">{s.title}</h3>
                                <p>{s.text}</p>
                              </div>
                              <a href="#contact" className="btn btn--dark btn--sm">
                                <span>See how we help</span>
                                <BtnIcon src="icon-caret-right-sm.svg" size={12} />
                              </a>
                            </div>
                            {s.frame ? (
                              <div className="stack-card__visual stack-card__visual--framed">
                                <img src={`${A}/${s.img}`} alt={s.alt} style={s.frame} />
                              </div>
                            ) : (
                              <div className="stack-card__visual">
                                <img src={`${A}/${s.img}`} width={440} height={424} alt={s.alt} />
                              </div>
                            )}
                          </div>
                        </article>
                      </div>
                    );
                  })}
                </div>
                <div className="stack__spacer" aria-hidden="true"></div>
              </div>
            </section>

            {/* ============ HOW IT WORKS ============ */}
            <section className="how" id="how-it-works">
              <img className="how__band how__band--top" src={`${A}/stripe-band.svg`} alt="" />
              <div className="how__inner">
                <header className="how__head">
                  <div className="how__head-left">
                    <span className="badge" data-reveal>HOW IT WORKS</span>
                    <h2 className="h2 how__title" data-reveal>Three steps. No retainer. No guesswork.</h2>
                  </div>
                  <p className="how__sub" data-reveal>Share your story. We handle your claim and guide you to a resolution, keeping you updated.</p>
                </header>

                <div className="steps">
                  {STEPS.map((s) => (
                    <article className="step" data-reveal-card key={s.title}>
                      <div className="step__top">
                        <div className="step__head">
                          <div className="step__titles">
                            <h3 className="step__title">{s.title}</h3>
                            <p className="step__kicker">{s.kicker}</p>
                          </div>
                          <WindowDots />
                        </div>
                        <p className="step__text">{s.text}</p>
                      </div>
                      <div className="step__art">
                        <ArtFx />
                        <ul className={s.wide ? "chips chips--wide" : "chips"}>
                          {s.chips.map((c) => <li key={c}>{c}</li>)}
                        </ul>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              <img className="how__band how__band--bottom" src={`${A}/stripe-band.svg`} alt="" />
            </section>

            {/* ============ TESTIMONIALS ============ */}
            <section className="testimonials" id="testimonials">
              <div className="testimonials__head">
                <div className="testimonials__copy">
                  <span className="badge" data-reveal>TESTIMONIALS</span>
                  <h2 className="h2 testimonials__title" data-reveal>Good Representation Should Feel Different.</h2>
                  <p className="testimonials__sub" data-reveal>Clients approach us during tough times. We prioritize clear communication, strategy, and ensuring they feel supported.</p>
                </div>
                <a href="#contact" className="btn btn--dark" data-reveal>
                  <span>See More Results</span>
                  <BtnIcon src="icon-caret-right.svg" />
                </a>
              </div>

              <div className="t-grid">
                {TESTIMONIALS.map((t) => (
                  <article className="t-card" style={{ "--col": t.col, "--row": t.row } as CSSProperties} data-reveal-card key={t.name}>
                    <div className="t-card__bar"><ArtFx /><WindowDots className="t-card__dots" /></div>
                    <div className="t-card__body">
                      <div className="fx fx--portrait" data-dither-keep data-dither={DITHER_MONO}><img src={`${A}/${t.img}`} alt="" /></div>
                      <div className="t-card__fade"></div>
                      <div className="t-card__who"><p className="t-card__name">{t.name}</p><p className="t-card__meta">{t.meta}</p></div>
                      <blockquote className={t.narrow ? "t-card__quote t-card__quote--narrow" : "t-card__quote"}>{t.quote}</blockquote>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ============ ABOUT ============ */}
            <section className="about" id="about">
              <img className="about__dots about__dots--tl" src={`${A}/about-dots.svg`} width={679} height={679} alt="" />
              <img className="about__dots about__dots--br" src={`${A}/about-dots.svg`} width={679} height={679} alt="" />

              <div className="about__inner">
                <article className="about-card" data-reveal-card>
                  <div className="about-card__bar">
                    <ArtFx />
                    <WindowDots className="about-card__dots" />
                  </div>
                  <div className="about-card__body">
                    {/* Figma 4296:69: room photo (cover) + Christina cutout, 291 × 513.5; dithered mono, colour on hover */}
                    <div className="fx fx--about" data-dither-keep data-dither={DITHER_MONO}>
                      <div className="fx__photo">
                        <img className="fx__layer fx__layer--cover" src={`${A}/about-room.jpg`} alt="" data-crop="cover" />
                        <img className="fx__layer fx__layer--about-person" src={`${A}/about-person.png`} alt="Portrait of Christina Malik" data-crop="[-60.2,-18.39,208.24,118.39]" />
                      </div>
                    </div>
                  </div>
                </article>

                <div className="about__content">
                  <div className="about__head">
                    <span className="badge badge--dark" data-reveal>ABOUT US</span>
                    <h2 className="h2 about__title" data-reveal>An Experienced Advocate. A Personal Partner.</h2>
                  </div>
                  <div className="about__body">
                    <div className="about__who" data-reveal>
                      <p className="about__name">Christina Malik</p>
                      <p className="about__role">Attorney &amp; Principal Consultant</p>
                    </div>
                    <div className="about__text" data-reveal>
                      <p>With extensive experience across legal strategy, compliance, and client advocacy, Christina brings a practical and personal approach to every matter.</p>
                      <p>She believes clients deserve more than legal answers—they deserve clarity, honest communication, and an advocate who stays involved from start to finish.</p>
                    </div>
                    <Stats variant="row" reveal />
                  </div>
                  <a href="#contact" className="btn btn--light" data-reveal>
                    <span>Meet Christina</span>
                    <BtnIcon src="icon-caret-right-dark.svg" />
                  </a>
                </div>
              </div>
            </section>

            {/* ============ FAQ ============ */}
            <section className="faq" id="faq">
              <div className="faq__left">
                <h2 className="h2 faq__title" data-reveal>Frequently Asked Questions</h2>
                <aside className="ask-card" data-reveal-card>
                  <div className="ask-card__bar"><ArtFx className="fx fx--art fx--art-faq" /></div>
                  <div className="ask-card__body">
                    <p className="ask-card__title">Still Have Questions?</p>
                    <div>
                      <p className="ask-card__text">You don&apos;t need to know exactly what you have before you call.</p>
                      <a href="#contact" className="btn btn--dark btn--soft">
                        <span>Start a Free Case Review</span>
                        <BtnIcon src="icon-caret-right.svg" />
                      </a>
                    </div>
                  </div>
                </aside>
              </div>

              {/* open/close state is driven by lib/main.js (exactly one item open) */}
              <div className="accordion" data-accordion>
                {FAQS.map((f, i) => {
                  const id = `faq-${i + 1}`;
                  const open = i === 0;
                  return (
                    <div className={open ? "acc-item is-open" : "acc-item"} key={id}>
                      <h3>
                        <button className="acc-trigger" aria-expanded={open} aria-controls={id} id={`${id}-btn`}>
                          <span>{f.q}</span>
                          <span className="acc-icon" aria-hidden="true">
                            <img className="acc-icon__minus" src={`${A}/icon-minus.svg`} width={20} height={20} alt="" />
                            <img className="acc-icon__plus" src={`${A}/icon-plus.svg`} width={20} height={20} alt="" />
                          </span>
                        </button>
                      </h3>
                      <div className="acc-panel" id={id} role="region" aria-labelledby={`${id}-btn`} hidden={!open}>
                        <div className="acc-panel__inner">
                          <p>{f.a}</p>
                          <a href="#contact" className="btn btn--dark">
                            <span>Learn More</span>
                            <BtnIcon src="icon-caret-right.svg" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ============ CTA + FOOTER ============ */}
            <section className="closing" id="contact">
              <img className="closing__bg" src={`${A}/hero-landscape.png`} alt="" />
              <div className="closing__fade"></div>

              <div className="closing__inner">
                <div className="cta">
                  <div className="cta__copy">
                    <h2 className="h2 cta__title" data-reveal><span className="cta__line">The insurer has already</span> <span className="cta__line">started a file. You should too.</span></h2>
                    <p className="cta__sub" data-reveal>A free case review takes 10 minutes. We’ll explain your claim&apos;s worth and next steps.</p>
                  </div>
                  <div className="cta__actions" data-reveal>
                    <div className="cta__buttons">
                      <a href="tel:+12125551234" className="btn btn--dark">
                        <span>Get a free case review</span>
                        <BtnIcon src="icon-caret-right.svg" />
                      </a>
                      <a href="mailto:hello@example.com" className="btn btn--outline">
                        <span>Get a free case review</span>
                        <BtnIcon src="icon-caret-right-outline.svg" />
                      </a>
                    </div>
                    <p className="cta__note">Free. Confidential. No fee unless we win.</p>
                  </div>
                </div>

                <hr className="closing__rule" />

                <footer className="footer">
                  <div className="footer__brand">
                    <img src={`${A}/logo.svg`} width={131} height={24} alt="Legal Compli" />
                    <p className="footer__tagline">We help those injured by negligence. You pay no fee unless we recover.</p>
                  </div>
                  <div className="footer__cols">
                    <div className="footer__col footer__col--sitemap">
                      <p className="footer__heading">Sitemaps</p>
                      <ul>
                        {NAV.map((n) => <li key={n.label}><a href={n.href}>{n.label}</a></li>)}
                      </ul>
                    </div>
                    <div className="footer__col footer__col--contact">
                      <p className="footer__heading">Contact</p>
                      <ul>
                        <li>California, USA, 63267</li>
                        <li><a href="tel:+12125551234">+1 (212) 555-1234</a></li>
                      </ul>
                    </div>
                    <div className="footer__col footer__col--hours">
                      <p className="footer__heading">Open hours</p>
                      <ul><li>Mon–Fri 8:00 a.m.–6:00 p.m.<br />24/7 intake line</li></ul>
                    </div>
                  </div>
                </footer>
              </div>
            </section>
          </main>
        </div>
      </div>

      <SiteScripts />
    </>
  );
}
