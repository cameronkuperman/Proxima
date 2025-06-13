import EmailSignupForm from './EmailSignupForm';

export default function Contact() {
  return (
    <section id="contact" className="py-24 px-6 bg-white text-center">
      <h2 className="text-3xl sm:text-4xl font-semibold font-[family-name:var(--font-heading)] mb-6">Stay in the loop</h2>
      <p className="text-lg max-w-xl mx-auto text-[#505861] mb-10 font-[family-name:var(--font-body)]">
        We&apos;re crafting the future of symptom analysis—be first to know when Proxima launches.
      </p>
      <div className="max-w-md mx-auto">
        <EmailSignupForm />
      </div>
    </section>
  );
} 