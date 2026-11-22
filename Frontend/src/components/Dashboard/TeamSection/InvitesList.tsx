// src/pages/Dashboard/components/TeamSection/InvitesList.tsx
import { Bell, Clock, X } from "lucide-react";
import LoadingSpinner from "../Common/LoadingSpinner";

interface Invite {
  id: string;
  token: string;
  email: string;
  first_name: string;
  last_name: string;
  expires_at: string;
}

interface InvitesListProps {
  invites: Invite[];
  isCaptain: boolean;
  onCancelInvite: (inviteToken: string, teamId: string) => Promise<boolean>;
  teamId: string;
  loading?: boolean;
}

const InvitesList = ({
  invites,
  isCaptain,
  onCancelInvite,
  teamId,
  loading = false,
}: InvitesListProps) => {
  if (loading) {
    return (
      <div className="card">
        <LoadingSpinner text="درحال بارگذاری دعوت‌نامه‌ها..." />
      </div>
    );
  }

  if (!invites || invites.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  return (
    <section className="card stack" aria-labelledby="invites-title">
      <div className="row">
        <span className="stat-icon is-yellow" aria-hidden="true">
          <Bell className="icon" />
        </span>
        <h3 className="card-title" id="invites-title">
          دعوت‌نامه‌های در انتظار پاسخ
        </h3>
        <span className="badge badge-warning">{invites.length} دعوت</span>
      </div>

      <div className="list">
        {invites.map((invite) => (
          <div className="list-row max-sm:flex-col max-sm:items-stretch!" key={invite.id}>
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="stat-icon is-yellow" aria-hidden="true">
                <Clock className="icon" />
              </span>
              <div className="list-main">
                <span className="list-title">
                  {invite.first_name} {invite.last_name}
                </span>
                <span className="list-meta wrap-anywhere" dir="ltr">
                  {invite.email}
                </span>
                <span className="list-meta">
                  انقضا: {formatDate(invite.expires_at)}
                </span>
              </div>
            </div>
            <div className="list-actions max-sm:flex-wrap max-sm:justify-between">
              <span className="status-pill is-waiting">
                <span className="dot" aria-hidden="true" />
                در انتظار پاسخ
              </span>
              <button
                type="button"
                className="btn btn-destructive"
                onClick={() => onCancelInvite(invite.token, teamId)}
                disabled={!isCaptain}
              >
                <X className="icon-sm" aria-hidden="true" />
                لغو دعوت
              </button>
            </div>
          </div>
        ))}
      </div>

      {!isCaptain && invites.length > 0 && (
        <div className="alert alert-info">
          <span className="alert-icon" aria-hidden="true">
            <Bell className="icon icon-sm" />
          </span>
          <p>فقط کاپیتان تیم می‌تواند دعوت‌نامه‌ها را مدیریت کند</p>
        </div>
      )}
    </section>
  );
};

export default InvitesList;
