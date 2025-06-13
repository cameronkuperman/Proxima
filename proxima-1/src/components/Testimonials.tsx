export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6 bg-[#F7F9FB] text-center">
      <h2 className="text-3xl sm:text-4xl font-semibold font-[family-name:var(--font-heading)] mb-12">What people are saying</h2>
      <div className="flex flex-col gap-10 max-w-4xl mx-auto">
        <blockquote className="bg-white shadow-md rounded-lg p-8">
          <p className="text-lg text-[#202225] font-[family-name:var(--font-body)] italic">
            &ldquo;I&apos;ve never seen symptom reporting feel this intuitive.&rdquo;
          </p>
          <footer className="mt-4 text-sm font-medium text-[#505861]">— Alex Tabaku</footer>
        </blockquote>
        <blockquote className="bg-white shadow-md rounded-lg p-8">
          <p className="text-lg text-[#202225] font-[family-name:var(--font-body)] italic">
            &ldquo;Finally, tech that actually understands how patients think.&rdquo;
          </p>
          <footer className="mt-4 text-sm font-medium text-[#505861]">— Kwame Botse Baidoo</footer>
        </blockquote>
      </div>
    </section>
  );
} 