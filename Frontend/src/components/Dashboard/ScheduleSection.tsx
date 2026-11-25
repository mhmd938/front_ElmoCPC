// src/pages/Dashboard/components/ScheduleSection.tsx
import { Calendar } from "lucide-react";

const ScheduleSection = () => {
  return (
    <section className="card stack">
      <div className="row">
        <span className="stat-icon is-yellow" aria-hidden="true">
          <Calendar className="icon" />
        </span>
        <h2 className="card-title">برنامه زمانی مسابقات</h2>
      </div>
      <div className="empty">
        <span className="empty-icon" aria-hidden="true">
          <Calendar className="icon-lg" />
        </span>
        <p className="empty-text">
          برنامه مسابقات پس از نهایی شدن اعلام می‌شود.
        </p>
      </div>
    </section>
  );
};

export default ScheduleSection;
