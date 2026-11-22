// src/components/Landing/Navbar/Navbar.tsx
import { useRef, useState } from "react";
import { Home, Info, Calendar, Trophy, Mail, Menu, X } from "lucide-react";
import Logo from "./Logo";
import UserDropdown from "./UserDropdown";

interface NavbarProps {
  isLoggedIn: boolean;
  displayName: string;
  onLogin: () => void;
  onRegister: () => void;
  onDashboard: () => void;
  onLogout: () => void;
  onScrollToSection: (id: string) => void;
}

const NAV_ICONS = {
  home: Home,
  about: Info,
  timeline: Calendar,
  rules: Trophy,
  contact: Mail,
} as const;

const Navbar = ({
  isLoggedIn,
  displayName,
  onLogin,
  onRegister,
  onDashboard,
  onLogout,
  onScrollToSection,
}: NavbarProps) => {
  const [activeId, setActiveId] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);

  const navItems = [
    { id: "home", label: "خانه" },
    { id: "about", label: "درباره مسابقه" },
    { id: "timeline", label: "جدول زمانی" },
    { id: "rules", label: "قوانین و جوایز" },
    { id: "contact", label: "تماس با ما" },
  ] as const;

  const handleNavClick = (id: string) => {
    setActiveId(id);
    if (menuOpen) {
      setMenuOpen(false);
      menuToggle.current?.focus();
    }
    if (id === "home") {
      window.scrollTo({ top: 0 });
      return;
    }
    onScrollToSection(id);
  };

  return (
    <header
      className="navbar"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          setMenuOpen(false);
          menuToggle.current?.focus();
        }
      }}
    >
      <div className="navbar-inner container">
        <button
          type="button"
          className="btn btn-ghost nav-toggle"
          aria-label="منوی اصلی"
          aria-expanded={menuOpen}
          aria-controls="landing-navigation"
          ref={menuToggle}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <Logo
          onClick={() => {
            setActiveId("home");
            setMenuOpen(false);
          }}
        />

        <nav
          id="landing-navigation"
          className={`nav-links${menuOpen ? " is-open" : ""}`}
          aria-label="ناوبری اصلی"
        >
          {navItems.map((item) => {
            const Icon = NAV_ICONS[item.id];
            return (
              <a
                key={item.id}
                className={`nav-link${activeId === item.id ? " is-active" : ""}`}
                aria-current={activeId === item.id ? "location" : undefined}
                href={`#${item.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  handleNavClick(item.id);
                }}
              >
                <Icon className="icon icon-sm" aria-hidden="true" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="nav-auth">
          {isLoggedIn ? (
            <UserDropdown
              displayName={displayName}
              onDashboard={onDashboard}
              onLogout={onLogout}
            />
          ) : (
            <>
              <button type="button" className="btn btn-ghost" onClick={onLogin}>
                ورود
              </button>
              <button type="button" className="btn btn-yellow" onClick={onRegister}>
                ثبت‌نام
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
