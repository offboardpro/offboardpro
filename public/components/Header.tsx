import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-10 py-8 max-w-7xl mx-auto bg-white">
      {/* Rule #1: Use the logo exactly as given */}
      <div className="flex items-center gap-4">
        <Image 
          src="/logo.png" 
          alt="OffboardPro" 
          width={52} 
          height={52} 
          priority
          className="object-contain"
        />
        <span className="text-brandNavy font-bold text-2xl tracking-tighter">
          OffboardPro
        </span>
      </div>

      {/* Public Navbar Copy */}
      <nav className="hidden md:flex items-center gap-10">
        <Link href="#" className="text-slate-500 hover:text-brandNavy transition-colors text-sm font-semibold">
          How it works
        </Link>
        <Link href="#" className="text-slate-500 hover:text-brandNavy transition-colors text-sm font-semibold">
          Pricing
        </Link>
        <Link href="#" className="text-slate-500 hover:text-brandNavy transition-colors text-sm font-semibold">
          Security
        </Link>
        <Link href="#" className="text-slate-500 hover:text-brandNavy transition-colors text-sm font-semibold">
          Sign in
        </Link>
        <Link 
          href="#" 
          className="bg-brandNavy text-white px-8 py-3 rounded-full text-sm font-bold hover:shadow-lg transition-all"
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}