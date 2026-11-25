// src/pages/Dashboard/components/SettingsSection.tsx
import { Settings } from "lucide-react";

interface SettingsSectionProps {
  userData: {
    name: string;
    familyName: string;
    email: string;
    phone: string;
  };
}

const SettingsSection = ({ userData }: SettingsSectionProps) => {
  return (
    <section className="card stack settings-card">
      <div className="row">
        <span className="stat-icon is-cyan" aria-hidden="true">
          <Settings className="icon" />
        </span>
        <h2 className="card-title">اطلاعات حساب کاربری</h2>
      </div>
      <dl className="kv-list">
        <div className="kv-row">
          <dt className="kv-key">نام و نام خانوادگی</dt>
          <dd className="kv-value">{userData.name} {userData.familyName}</dd>
        </div>
        <div className="kv-row">
          <dt className="kv-key">ایمیل</dt>
          <dd className="kv-value"><bdi dir="ltr">{userData.email}</bdi></dd>
        </div>
        <div className="kv-row">
          <dt className="kv-key">شماره موبایل</dt>
          <dd className="kv-value"><bdi dir="ltr">{userData.phone}</bdi></dd>
        </div>
      </dl>
    </section>
  );
};

export default SettingsSection;
