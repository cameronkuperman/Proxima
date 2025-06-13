import Image from "next/image";
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="w-full h-[100px] flex items-center justify-between px-6 md:px-12 bg-transparent fixed top-0 left-0 z-30 overflow-hidden">
      <div className="flex items-center gap-2">
        {/* Replace /logo.png with actual logo file in public folder */}
        <Image src="/logo3.png" alt="Proxima logo" width={200} height={100} priority />
        <span className="sr-only">Proxima</span>
      </div>
      <ul className="hidden md:flex gap-8 font-medium">
        <li>
          <Link href="#about" className="hover:text-[#2962FF] transition-colors">About</Link>
        </li>
        <li>
          <Link href="#testimonials" className="hover:text-[#2962FF] transition-colors">Testimonials</Link>
        </li>
        <li>
          <Link href="#contact" className="hover:text-[#2962FF] transition-colors">Contact</Link>
        </li>
      </ul>
    </nav>
  );
} 