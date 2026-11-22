// src/pages/Dashboard/components/TeamSection/TeamMembers.tsx
import { Users, CheckCircle } from "lucide-react";

interface TeamMember {
  id: string | number;
  name: string;
  familyName: string;
  email: string;
  phone: string;
  isCaptain?: boolean;
}

interface TeamMembersProps {
  members: TeamMember[];
}

const TeamMembers = ({ members }: TeamMembersProps) => {
  return (
    <section className="stack" aria-labelledby="members-title">
      <div className="row">
        <span className="stat-icon is-cyan" aria-hidden="true">
          <Users className="icon" />
        </span>
        <h3 className="card-title" id="members-title">
          اعضای تیم
        </h3>
      </div>

      <div className="grid grid-3">
        {members.map((member, index) => (
          <article className="card member-card" key={member.id}>
            <div className="member-top">
              <span className="avatar" aria-hidden="true">
                {member.name?.charAt(0)}
              </span>
              <div className="user-meta min-w-0">
                <span className="user-name">
                  {member.name} {member.familyName}
                </span>
                <span className="user-role wrap-anywhere" dir="ltr">
                  {member.email}
                </span>
                <span className="user-role">{member.phone}</span>
              </div>
            </div>

            <div className="member-foot">
              <span
                className={`badge ${
                  member.isCaptain || index === 0 ? "badge-cyan" : "badge-neutral"
                }`}
              >
                {member.isCaptain || index === 0 ? "کاپیتان" : "عضو تیم"}
              </span>
              <span className="row small text-success">
                <CheckCircle className="icon-sm" aria-hidden="true" />
                عضو تایید شده
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TeamMembers;
