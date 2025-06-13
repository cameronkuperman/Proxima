import EmailSignupForm from "./EmailSignupForm";

export default function Hero() {
  return (
    <section className="w-full flex flex-col items-center justify-center text-center pt-32 pb-24 px-6 bg-[#F7F9FB]" id="home">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight max-w-4xl font-[family-name:var(--font-heading)]">
        Point. Describe. Understand.
        <br />
        A smarter way to track your symptoms.
      </h1>
      <p className="mt-6 text-lg max-w-xl text-[#505861] font-[family-name:var(--font-body)]">
        Our 3D-powered symptom explorer lets you point to what hurts, tell us how it
        feels, and stay informed—coming 2025.
      </p>
      <div className="mt-10 w-full max-w-md">
        <EmailSignupForm />
      </div>
      <p className="mt-4 text-sm text-[#70767f]">
        Questions? Text <a href="sms:8434466154" className="underline hover:text-[#2962FF]">843-446-6154</a>
      </p>
    </section>
  );
} 