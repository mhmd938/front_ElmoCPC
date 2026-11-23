// src/pages/Landing.tsx
import { useCountdown } from "@/hooks/LandingPage/useCountdown";
import { useUserAuth } from "@/hooks/LandingPage/useUserAuth";
import Navbar from "@/components/Landing/Navbar/Navbar";
import HeroSection from "@/components/Landing/HeroSection/HeroSection";
import StatsSection from "@/components/Landing/Sections/StatsSection";
import FeaturesSection from "@/components/Landing/Sections/FeaturesSection";
import PrizesSection from "@/components/Landing/Sections/PrizesSection";
import TimelineSection from "@/components/Landing/Sections/TimelineSection";
import CTASection from "@/components/Landing/Sections/CTASection";
import Footer from "@/components/Custom/Footer";

const OPENMOJI_SOURCE_BASE =
  "https://github.com/hfg-gmuend/openmoji/blob/5acb7f049c45c57a98449122d470de9f09bb6794/color/svg";

function ICPCLanding() {
  const countdown = useCountdown(new Date("2026-12-12T08:00:00"));
  const { isLoggedIn, displayName, handleLogout } = useUserAuth();

  const handleRegisterClick = () => {
    window.location.href = "/signup";
  };

  const handleLoginClick = () => {
    window.location.href = "/login";
  };

  const handleDashboardClick = () => {
    window.location.href = "/dashboard";
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView();
  };

  return (
    <div className="event-page landing-page" dir="rtl">
      <Navbar
        isLoggedIn={isLoggedIn}
        displayName={displayName}
        onLogin={handleLoginClick}
        onRegister={handleRegisterClick}
        onDashboard={handleDashboardClick}
        onLogout={handleLogout}
        onScrollToSection={scrollToSection}
      />

      <main>
        <HeroSection
          countdown={countdown}
          isLoggedIn={isLoggedIn}
          onLogin={handleLoginClick}
          onRegister={handleRegisterClick}
          onDashboard={handleDashboardClick}
        />

        <StatsSection />
        <FeaturesSection />
        <TimelineSection />
        <PrizesSection />
        <CTASection
          onLogin={handleLoginClick}
          isLoggedIn={isLoggedIn}
          onDashboard={handleDashboardClick}
          onRegister={handleRegisterClick}
          onScrollToRules={() => scrollToSection("rules")}
        />
      </main>

      <Footer
        credits={
          <p className="footer-attribution" dir="ltr">
            Artwork by{" "}
            <a href="https://openmoji.org/" target="_blank" rel="noopener noreferrer">
              OpenMoji
            </a>
            :{" "}
            <a href={OPENMOJI_SOURCE_BASE + "/1F426.svg"} target="_blank" rel="noopener noreferrer">
              Bird (U+1F426)
            </a>
            ,{" "}
            <a href={OPENMOJI_SOURCE_BASE + "/1F989.svg"} target="_blank" rel="noopener noreferrer">
              Owl (U+1F989)
            </a>
            , and{" "}
            <a href={OPENMOJI_SOURCE_BASE + "/1F986.svg"} target="_blank" rel="noopener noreferrer">
              Duck (U+1F986)
            </a>
            . Licensed under{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY-SA 4.0
            </a>
            .
          </p>
        }
      />
    </div>
  );
}

export default ICPCLanding;
