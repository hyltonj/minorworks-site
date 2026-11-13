import Script from "next/script";

export default function Footer() {
  return (
    <>
      <div id="mw-footer" />
      <Script
        src="https://minorworks.co/footer.js"
        data-hide="related"
        strategy="afterInteractive"
      />
    </>
  );
}
