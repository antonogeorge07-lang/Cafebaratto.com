import { createFileRoute } from "@tanstack/react-router";
import { Coffee, Croissant, Sun, MapPin, Clock, Star, Instagram, Twitter, Menu } from "lucide-react";
import { useState } from "react";
import hero from "@/assets/interior.jpg";
import storefront from "@/assets/storefront.jpg";
import coffee from "@/assets/espresso-pull.jpg";
import breakfast from "@/assets/breakfast.jpg";
import pastry from "@/assets/pastry.jpg";
import latte from "@/assets/portafilter.jpg";
import mascot from "@/assets/mascot.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cafeteria Baratto — Valencia's neighborhood cafe" },
      {
        name: "description",
        content:
          "Exceptional coffee, hearty Spanish breakfasts and a sunny terrace near Valencia's Central Market. Open every day on Carrer de Vinatea.",
      },
      { property: "og:title", content: "Cafeteria Baratto — Valencia" },
      {
        property: "og:description",
        content:
          "Your neighborhood retreat near Valencia's Central Market. Exceptional coffee, breakfast and a welcoming terrace.",
      },
      { property: "og:image", content: hero },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CafeOrCoffeeShop",
          name: "Cafeteria Baratto",
          image: hero,
          address: {
            "@type": "PostalAddress",
            streetAddress: "C. de Vinatea, 20",
            postalCode: "46001",
            addressLocality: "València",
            addressCountry: "ES",
          },
          servesCuisine: ["Coffee", "Spanish breakfast"],
          openingHours: ["Mo-Fr 07:00-22:00", "Sa-Su 09:00-22:00"],
        }),
      },
    ],
  }),
  component: Index,
});

const NAV = [
  { href: "#story", label: "Our Story" },
  { href: "#ritual", label: "The Ritual" },
  { href: "#menu", label: "Menu" },
  { href: "#space", label: "The Space" },
];

function Index() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-oak-50 text-coffee-900">
      {/* NAV */}
      <header className="absolute inset-x-0 top-0 z-30">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <a href="#top" className="font-serif text-2xl font-semibold text-oak-50">
            Baratto
          </a>
          <ul className="hidden items-center gap-8 text-sm text-oak-100 md:flex">
            {NAV.map((i) => (
              <li key={i.href}>
                <a href={i.href} className="transition hover:text-oak-300">
                  {i.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#visit"
            className="hidden rounded-full bg-oak-50 px-5 py-2.5 text-sm font-medium text-coffee-900 transition hover:bg-oak-200 md:inline-block"
          >
            Visit Us
          </a>
          <button
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
            className="rounded-md p-2 text-oak-50 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </nav>
        {open && (
          <div className="mx-6 rounded-2xl bg-coffee-950/95 p-6 backdrop-blur md:hidden">
            <ul className="space-y-3 text-oak-100">
              {NAV.map((i) => (
                <li key={i.href}>
                  <a href={i.href} onClick={() => setOpen(false)}>
                    {i.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#visit" onClick={() => setOpen(false)} className="text-oak-300">
                  Visit Us
                </a>
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="top" className="hero-pattern relative overflow-hidden text-oak-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 pt-32 pb-24 lg:grid-cols-2 lg:items-center lg:gap-8 lg:px-10 lg:pt-40 lg:pb-32">
          <div className="fade-in-up">
            <p className="mb-6 text-sm uppercase tracking-[0.25em] text-oak-300">
              Carrer de Vinatea, Valencia
            </p>
            <h1 className="font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Cafeteria <em className="font-normal text-oak-300">Baratto</em>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-oak-100/90">
              Your neighborhood retreat near the Central Market. Exceptional coffee, delicious
              breakfasts, and a welcoming terrace to watch the city go by.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#visit"
                className="rounded-full bg-oak-50 px-6 py-3 text-sm font-medium text-coffee-900 transition hover:bg-oak-200"
              >
                Find our terrace
              </a>
              <a
                href="#menu"
                className="rounded-full border border-oak-300/40 px-6 py-3 text-sm font-medium text-oak-100 transition hover:border-oak-300 hover:text-oak-50"
              >
                Explore the menu
              </a>
            </div>
          </div>
          <div className="relative fade-in-up delay-200">
            <div className="hover-float overflow-hidden rounded-3xl shadow-2xl ring-1 ring-oak-900/40">
              <img
                src={hero}
                alt="Sunlit interior of Cafeteria Baratto in Valencia"
                width={1600}
                height={1200}
                className="h-[480px] w-full object-cover sm:h-[560px]"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-oak-50 p-5 text-coffee-900 shadow-xl sm:block">
              <div className="flex items-center gap-3">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-oak-500 text-oak-500" />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold">4.9 rating</p>
                  <p className="text-xs text-coffee-900/60">From hundreds of locals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="ritual" className="bg-oak-50 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-oak-700">The Ritual</p>
            <h2 className="mt-4 font-serif text-4xl text-coffee-900 sm:text-5xl">
              Taste & Atmosphere
            </h2>
            <p className="mt-5 text-coffee-900/70">
              Three small things, done well, every morning.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Coffee,
                title: "Exceptional Coffee",
                body: "Rich, aromatic blends pulled to order. Locals and travellers agree — every cup makes the morning a little better.",
              },
              {
                icon: Croissant,
                title: "Hearty Breakfasts",
                body: "From classic Spanish tostadas to flaky pastries, our morning menu is built to start the day right.",
              },
              {
                icon: Sun,
                title: "Sunny Terrace",
                body: "Soak up Valencia's golden light on our charming terrace — the perfect spot to read, talk, or watch the street.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="group rounded-3xl border border-oak-200 bg-white p-8 transition hover:-translate-y-1 hover:border-oak-400 hover:shadow-xl"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-oak-100 text-oak-700 transition group-hover:bg-oak-700 group-hover:text-oak-50">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-serif text-2xl text-coffee-900">{title}</h3>
                <p className="mt-3 text-coffee-900/70">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MENU / GALLERY */}
      <section id="menu" className="bg-oak-100 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-oak-700">A glimpse</p>
            <h2 className="mt-4 font-serif text-4xl text-coffee-900 sm:text-5xl">
              A Taste of Baratto
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {[
              { src: coffee, alt: "Espresso in a white cup", span: "row-span-2" },
              { src: breakfast, alt: "Spanish tostadas and orange juice" },
              { src: pastry, alt: "Fresh pastries in a basket" },
              { src: latte, alt: "Barista pouring latte art" },
              { src: storefront, alt: "Cafeteria Baratto storefront", span: "col-span-2" },
              { src: mascot, alt: "Baratto coffee mascot" },
            ].map((img, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl ${img.span ?? ""} group`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  width={1200}
                  height={1200}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY / ABOUT */}
      <section id="story" className="bg-oak-50 py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10">
          <div className="relative">
            <img
              src={storefront}
              alt="Cafeteria Baratto storefront in Valencia"
              loading="lazy"
              width={1200}
              height={1200}
              className="h-[520px] w-full rounded-3xl object-cover shadow-xl"
            />
            <div className="absolute -bottom-6 -right-6 hidden rounded-2xl bg-coffee-900 p-6 text-oak-50 shadow-xl sm:block">
              <p className="font-serif text-4xl">4.9</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-oak-300">Top Rated Cafe</p>
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-oak-700">Our Atmosphere</p>
            <h2 className="mt-4 font-serif text-4xl text-coffee-900 sm:text-5xl">
              A beloved local gathering place.
            </h2>
            <p className="mt-6 text-coffee-900/75">
              Tucked away near the historic Central Market, Cafeteria Baratto has become a staple
              for both Valencian locals and visiting explorers. We pride ourselves on creating a
              space where everyone feels like a regular.
            </p>
            <p className="mt-4 text-coffee-900/75">
              Whether you're stopping by for a quick, expertly pulled espresso before work, or
              lingering over a hearty breakfast on our terrace, our friendly staff and warm
              ambiance make every visit memorable.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Consistently rated for outstanding, delicious coffee.",
                "Spacious outdoor seating to soak up the Spanish sun.",
                "Located steps from Valencia's top attractions.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-coffee-900/80">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-oak-600" />
                  {t}
                </li>
              ))}
            </ul>

            <a
              href="#visit"
              className="mt-10 inline-block rounded-full bg-coffee-900 px-6 py-3 text-sm font-medium text-oak-50 transition hover:bg-coffee-950"
            >
              Plan your visit
            </a>
          </div>
        </div>
      </section>

      {/* VISIT */}
      <section id="visit" className="bg-coffee-900 py-24 text-oak-50 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div id="space" className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <h2 className="font-serif text-4xl sm:text-5xl">Come say hi.</h2>
              <p className="mt-6 max-w-md text-oak-100/80">
                Find us on Carrer de Vinatea, just a short walk from the Central Market. We're open
                early to pour your perfect morning cup.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-oak-50/10 text-oak-300">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm uppercase tracking-widest text-oak-300">Location</p>
                    <p className="mt-1 leading-relaxed">
                      C. de Vinatea, 20<br />
                      46001 València, Spain
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-oak-50/10 text-oak-300">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm uppercase tracking-widest text-oak-300">Hours</p>
                    <p className="mt-1 leading-relaxed">
                      Mon – Fri: 7:00 AM – 10:00 PM<br />
                      Sat – Sun: 9:00 AM – 10:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl">
              <img
                src={hero}
                alt="Inside Cafeteria Baratto"
                loading="lazy"
                width={1600}
                height={1200}
                className="h-[480px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-coffee-950/80 to-transparent" />
              <p className="absolute bottom-6 left-6 font-serif text-2xl text-oak-50">
                See you soon!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-coffee-950 py-12 text-oak-100/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 sm:flex-row sm:items-end sm:justify-between lg:px-10">
          <div>
            <p className="font-serif text-2xl text-oak-50">Baratto</p>
            <p className="mt-2 text-sm">Your favorite neighborhood cafe in Valencia.</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#"
              aria-label="Instagram"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-oak-100/20 transition hover:border-oak-300 hover:text-oak-300"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-oak-100/20 transition hover:border-oak-300 hover:text-oak-300"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-7xl px-6 text-xs text-oak-100/50 lg:px-10">
          © {new Date().getFullYear()} Cafeteria Baratto. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
