// src/pages/Dashboard/components/TeamSection/TeamHeader.tsx
import { Plus, CheckCircle, Upload, Trash2, AlertCircle } from "lucide-react";
import StatusBadge from "../Common/StatusBadge";

interface TeamHeaderProps {
  teamData: {
    name: string;
    description?: string;
    status: string;
    receipt_image_url?: string;
    members?: any[];
  };
  isCaptain: boolean;
  invites: any[];
  onInviteMember: () => void;
  onUploadReceipt: () => void;
  onDeleteTeam: () => void;
  onSubmitTeam: () => void;
}

const TeamHeader = ({
  teamData,
  isCaptain,
  invites,
  onInviteMember,
  onUploadReceipt,
  onDeleteTeam,
  onSubmitTeam,
}: TeamHeaderProps) => {
  const canInvite =
    (!invites || invites.length < 3) &&
    (teamData.status === "draft" || !teamData);

  return (
    <div className="card team-head">
      <div>
        <h2 className="card-title">{teamData.name}</h2>
        {teamData.description && (
          <p className="card-text">{teamData.description}</p>
        )}

        <div className="row">
          <StatusBadge status={teamData.status} />
          {teamData.receipt_image_url && (
            <span className="row small text-success">
              <CheckCircle className="icon-sm" aria-hidden="true" />
              فیش آپلود شده
            </span>
          )}
        </div>
      </div>

      <div className="row">
        {teamData.status === "draft" && isCaptain && (
          <button type="button" className="btn btn-primary" onClick={onSubmitTeam}>
            <CheckCircle className="icon-sm" aria-hidden="true" />
            ثبت نهایی تیم
          </button>
        )}

        {canInvite && isCaptain && (
          <button type="button" className="btn btn-secondary" onClick={onInviteMember}>
            <Plus className="icon-sm" aria-hidden="true" />
            دعوت عضو
          </button>
        )}

        {teamData.status === "waiting_for_payment" && isCaptain && (
          <button type="button" className="btn btn-secondary" onClick={onUploadReceipt}>
            <Upload className="icon-sm" aria-hidden="true" />
            آپلود فیش
          </button>
        )}

        {teamData.status === "draft" && isCaptain && (
          <button
            type="button"
            className="btn btn-destructive"
            onClick={onDeleteTeam}
          >
            <Trash2 className="icon-sm" aria-hidden="true" />
            حذف تیم
          </button>
        )}
      </div>

      {!isCaptain && (
        <div className="alert alert-info">
          <span className="alert-icon" aria-hidden="true">
            <AlertCircle className="icon icon-sm" />
          </span>
          <div>
            <p className="alert-title">شما عضو تیم هستید</p>
            <p>
              برای تغییرات در تیم (ثبت نهایی، دعوت عضو، حذف تیم) با کاپیتان
              تیم تماس بگیرید.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamHeader;
