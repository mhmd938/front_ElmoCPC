// src/pages/Dashboard/Dashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUserStore from "@/store/userStore/userStore";
import { useDashboard } from "@/hooks/useDashboard.ts";
import Sidebar from "@/components/Dashboard/Sidebar/Sidebar";
import Header from "@/components/Dashboard/Header/Header";
import OverviewSection from "@/components/Dashboard/OverviewSection/OverviewSection";
import TeamSection from "@/components/Dashboard/TeamSection/TeamSection";
import LoadingSpinner from "@/components/Dashboard/Common/LoadingSpinner";
import DeleteTeamModal from "@/components/Dashboard/Modals/DeleteTeamModal";
import UploadReceiptModal from "@/components/Dashboard/Modals/UploadReceiptModal";
import SubmitTeamModal from "@/components/Dashboard/Modals/SubmitTeamModal";
import ScheduleSection from "@/components/Dashboard/ScheduleSection";
import SettingsSection from "@/components/Dashboard/SettingsSection";
import NotificationsList from "@/components/Dashboard/OverviewSection/NotificationsList";
import { dashboardTabs, type DashboardTabId } from "@/components/Dashboard/dashboardTabs";
import { clearSession } from "@/services/authSession";

const paymentInfo = {
  ticketPrice: 660000,
  cardNumber: "6104-3387-4761-8581",
  bankName: "بانک ملت مهدی تقی دولابی",
};

function Dashboard() {
  const navigate = useNavigate();
  const { authUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<DashboardTabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    userData,
    teamData,
    loading,
    teamLoading,
    invites,
    isCaptain,
    daysLeft,
    notifications,
    handleSubmitTeam,
    handleDeleteTeam,
    handleUploadReceipt,
    handleCancelInvite,
    handleStartSubmitProcess,
    fetchTeamData,
  } = useDashboard(authUser);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    // if (!authUser) {
    //   navigate("/login");
    // }
  }, [authUser, navigate]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!userData) {
    return (
      <div className="auth-page" dir="rtl">
        <div className="auth-card stack text-center">
          <p className="alert alert-danger">
            <span className="alert-icon" aria-hidden="true">
              <svg
                className="icon icon-sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </span>
            <span>کاربر یافت نشد</span>
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="btn btn-primary btn-block"
          >
            بازگشت به ورود
          </button>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewSection
            userData={userData}
            teamData={teamData}
            isCaptain={isCaptain}
            daysLeft={daysLeft}
            notifications={notifications}
            onUploadReceipt={() => setShowUploadModal(true)}
            paymentInfo={paymentInfo}
          />
        );
      case "team":
        return (
          <TeamSection
            teamData={teamData}
            invites={invites}
            isCaptain={isCaptain}
            loading={teamLoading}
            onRefresh={fetchTeamData}
            onDeleteTeam={() => setShowDeleteModal(true)}
            onSubmitTeam={() => setShowSubmitModal(handleStartSubmitProcess())}
            onUploadReceipt={() => setShowUploadModal(true)}
            onCancelInvite={handleCancelInvite}
            onCreateTeam={() => navigate("/buildteam")}
            onInviteMember={() => navigate(`/invitemember?teamId=${encodeURIComponent(teamData?.id ?? "")}`)}
            paymentInfo={paymentInfo}
          />
        );
      case "schedule":
        return <ScheduleSection />;
      case "notifications":
        return <NotificationsList notifications={notifications} showAll />;
      case "settings":
        return <SettingsSection userData={userData} />;
    }
    return null;
  };

  const activeContent = renderActiveTab();

  return (
    <div className="dashboard-page" dir="rtl">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      <div className={`with-sidebar${sidebarOpen ? "" : " is-collapsed"}`}>
        <Header
          userData={userData}
          teamData={teamData}
          isCaptain={isCaptain}
          onNavigateHome={() => navigate("/")}
        />

        <main className="app-main">
          <div className="tabs" role="tablist" aria-label="نمای داشبورد">
            {dashboardTabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`tab${activeTab === id ? " is-active" : ""}`}
                role="tab"
                id={`tab-${id}`}
                aria-selected={activeTab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="tab-panels">
            <section
              className="tab-panel stack-lg"
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
            >
              {activeContent}
            </section>
          </div>
        </main>
      </div>

      {/* Modals */}
      <DeleteTeamModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        teamName={teamData?.name || ""}
        onConfirm={handleDeleteTeam}
      />

      <UploadReceiptModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadReceipt}
        paymentInfo={paymentInfo}
      />

      <SubmitTeamModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        teamName={teamData?.name || ""}
        memberCount={teamData?.members?.length || 0}
        pendingInvites={invites?.length || 0}
        onSubmit={handleSubmitTeam}
      />
    </div>
  );
}

export default Dashboard;
