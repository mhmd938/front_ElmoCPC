// src/pages/Dashboard/components/OverviewSection/WelcomeBanner.tsx

interface WelcomeBannerProps {
  name: string;
}

const WelcomeBanner = ({ name }: WelcomeBannerProps) => {
  return (
    <div className="banner">
      <div>
        <h1 className="banner-title">سلام، {name}! 👋</h1>
        <p className="banner-text">
          به داشبورد مسابقات ELMOCPC 2026 خوش آمدید
        </p>
      </div>
    </div>
  );
};

export default WelcomeBanner;
