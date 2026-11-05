import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy | Minor Works",
  description:
    "What the Minor Works sites collect and what we do with it. Short and plain.",
  alternates: { canonical: "https://minorworks.co/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="px-6 max-w-2xl mx-auto py-16 md:py-24 text-mw-text-muted leading-relaxed">
      <p className="text-sm mb-6">
        <a href="/" className="underline underline-offset-4">
          Minor Works
        </a>
      </p>
      <h1 className="text-3xl md:text-4xl font-semibold text-mw-text-dark mb-2">
        Privacy
      </h1>
      <p className="text-sm mb-10">Last updated November 5, 2026</p>

      <div className="space-y-8 text-base">
        <p>
          Minor Works is a small studio in Boston. It makes games and tools
          that live on minorworks.co and on sites of their own. This page
          covers all of them. We collect as little as we can and we do not
          show ads or sell what we collect.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-mw-text-dark mb-2">
            Visits and analytics
          </h2>
          <p>
            We use Google Analytics to count visits. It records things like
            the page you viewed and roughly where you are (country or
            region) along with your device type and how you arrived. We
            use it to see what people enjoy so we can make more of it. It is
            not used for advertising. Our shared footer skips it when your
            browser sends Do Not Track or Global Privacy Control.
          </p>
          <p className="mt-3">
            Some sites also keep simple counts of their own such as page
            views and game plays. These use a random number that disappears
            when you close the tab. They do not use cookies and do not
            identify you.
          </p>
          <p className="mt-3">
            When you follow a link from one Minor Works site to another the
            link carries a short tag that says which site sent you. That
            tells us which cross links get used.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-mw-text-dark mb-2">
            When you give us something
          </h2>
          <p>
            <strong className="text-mw-text-dark">Ex Libris Omnium.</strong>{" "}
            If you reserve a pack or follow a book we keep your email
            address to send what you asked for and we do not share it. If
            you add a stop to a book&apos;s journey we keep what you enter
            such as your initials and town with a rating and a few words.
            Those stops are public on the book&apos;s journey page and on
            the Books on the Move page. Please do not enter anything you
            would not want shared.
          </p>
          <p className="mt-3">
            <strong className="text-mw-text-dark">Small Canon.</strong> We
            keep anonymous usage counts so we can see how the site is used.
            Book covers and details come from Open Library so your browser
            may contact it while you search.
          </p>
          <p className="mt-3">
            <strong className="text-mw-text-dark">Email to us.</strong> If
            you write to hello@minorworks.co we read it and reply. Mail is
            passed along by a forwarding service on its way to us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-mw-text-dark mb-2">
            Who helps us run this
          </h2>
          <p>
            The sites are hosted on Netlify. Some use Supabase to store data
            and Resend to send email. They handle data only to do that job
            for us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-mw-text-dark mb-2">
            Your choices
          </h2>
          <p>
            You can ask us to delete what we hold about you or to stop
            emailing you at any time. Write to{" "}
            <a
              href="mailto:hello@minorworks.co"
              className="underline underline-offset-4"
            >
              hello@minorworks.co
            </a>{" "}
            and we will do it. You can also block analytics in your browser
            and the sites will still work.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-mw-text-dark mb-2">
            Children
          </h2>
          <p>
            The sites are not aimed at children under 13 and we do not
            knowingly collect their information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-mw-text-dark mb-2">
            Changes
          </h2>
          <p>
            If this changes we will update the date above. Questions? Write
            to hello@minorworks.co.
          </p>
        </section>

        <p className="text-sm">Minor Works Studio · Boston</p>
      </div>
    </main>
  );
}
