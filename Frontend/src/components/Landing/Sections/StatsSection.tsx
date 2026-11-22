// src/components/Landing/Sections/StatsSection.tsx
import { Flag, GraduationCap, Trophy, Users } from "lucide-react";

const statIcons = [GraduationCap, Users, Trophy, Flag];

const stats = [
  { value: "15+", label: "دانشگاه شرکت‌کننده" },
  { value: "1200+", label: "شرکت‌کننده" },
  { value: "5", label: "سال تجربه موفق" },
  { value: "200+", label: "تیم ثبت‌نام‌شده" },
];

const StatsSection = () => {
  return (
    <section className="section stats-section" aria-label="آمار مسابقه">
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => {
            const Icon = statIcons[index];
            return (
              <div className="stat-card" key={stat.label}>
                <Icon className="stat-mark" aria-hidden="true" />
                <bdi className="stat-value" dir="ltr">{stat.value}</bdi>
                <span className="stat-label">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
