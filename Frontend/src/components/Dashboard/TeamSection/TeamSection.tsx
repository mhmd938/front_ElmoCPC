// src/pages/Dashboard/components/TeamSection/TeamSection.tsx
import TeamHeader from "./TeamHeader.tsx";
import TeamStatusCard from "./TeamStatusCard.tsx";
import TeamMembers from "./TeamMembers.tsx";
import InvitesList from "./InvitesList.tsx";
import LoadingSpinner from "../Common/LoadingSpinner.tsx";

interface TeamSectionProps {
  teamData: any;
  invites: any[];
  isCaptain: boolean;
  loading: boolean;
  onRefresh: () => void;
  onDeleteTeam: () => void;
  onSubmitTeam: () => void;
  onUploadReceipt: () => void;
  onCancelInvite: (inviteToken: string, inviteid: string) => Promise<boolean>;
  onCreateTeam: () => void;
  onInviteMember: () => void;
  paymentInfo: {
    ticketPrice: number;
    cardNumber: string;
    bankName: string;
  };
}

const TeamSection = ({
  teamData,
  invites,
  isCaptain,
  loading,
  onRefresh,
  onDeleteTeam,
  onSubmitTeam,
  onUploadReceipt,
  onCancelInvite,
  onCreateTeam,
  onInviteMember,
  paymentInfo
}: TeamSectionProps) => {
  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner text="درحال بارگذاری اطلاعات تیم..." />
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="empty">
        <span className="empty-icon" aria-hidden="true">
          <svg
            className="icon-lg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <p className="empty-text">شما هنوز تیمی ندارید</p>
        <p className="small text-muted">
          برای شرکت در مسابقه، ابتدا یک تیم تشکیل دهید
        </p>
        <button type="button" className="btn btn-primary" onClick={onCreateTeam}>
          <svg
            className="icon-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 4v16m8-8H4" />
          </svg>
          تشکیل تیم جدید
        </button>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR").format(price) + " هزار تومان برای کل تیم";
  };

  return (
    <div className="space-y-6">
      <TeamHeader
        teamData={teamData}
        isCaptain={isCaptain}
        onInviteMember={onInviteMember}
        onUploadReceipt={onUploadReceipt}
        onDeleteTeam={onDeleteTeam}
        onSubmitTeam={onSubmitTeam}
        invites={invites}
      />

      <TeamStatusCard
        teamData={teamData}
        formatPrice={formatPrice}
        paymentInfo={paymentInfo}
      />

      {invites?.length > 0 && isCaptain && (
        <InvitesList
          invites={invites}
          isCaptain={isCaptain}
          onCancelInvite={onCancelInvite}
          teamId={teamData.id.toString()}
        />
      )}

      {teamData.members && teamData.members.length > 0 && (
        <TeamMembers members={teamData.members} />
      )}

      <div className="row">
        <button type="button" className="btn btn-secondary" onClick={onRefresh}>
          بروزرسانی اطلاعات تیم
        </button>
      </div>
    </div>
  );
};

export default TeamSection;