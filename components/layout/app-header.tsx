import { BurgerMenu } from "./burger-menu";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex items-center justify-between px-2 py-2">
        <BurgerMenu />
        <span className="text-lg font-semibold">Racha dos Primos</span>
        <ThemeToggle />
      </div>
    </header>
  );
}
