import { BlocksIcon } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm"> {/* Added z-20 */}
      <nav className="flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <a
          href="#"
          className="flex items-center gap-2 text-lg font-semibold md:text-base text-primary"
        >
          <BlocksIcon className="h-6 w-6" />
          <span className="sr-only">Scratch Tutorial Maker</span> {/* Updated screen reader text */}
          Scratch Tutorial Maker {/* Updated visible text */}
        </a>
      </nav>
      {/* Add user menu or other header items here if needed */}
    </header>
  );
}
