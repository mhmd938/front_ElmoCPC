import { getStatusPillClass, translateTeamStatus } from "@/services/teamService";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span className={`status-pill ${getStatusPillClass(status)}`}>
      <span className="dot" aria-hidden="true" />
      {translateTeamStatus(status)}
    </span>
  );
};

export default StatusBadge;
