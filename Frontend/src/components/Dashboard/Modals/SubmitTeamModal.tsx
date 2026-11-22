// src/components/Dashboard/Modals/SubmitTeamModal.tsx (نسخه پیشرفته)
import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Users,
  X,
  ChevronRight,
} from "lucide-react";
import BaseModal from "./BaseModal";

interface SubmitTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  memberCount: number;
  pendingInvites: number;
  onSubmit: () => Promise<boolean>;
  teamStatus?: string;
}

type Step = 1 | 2 | 3; // 1: تأیید اولیه, 2: بررسی شرایط, 3: نتیجه

const SubmitTeamModal = ({
  isOpen,
  onClose,
  teamName,
  memberCount,
  pendingInvites,
  onSubmit,
  teamStatus = "draft",
}: SubmitTeamModalProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message?: string;
  } | null>(null);

  const hasPendingInvites = pendingInvites > 0;
  const hasMinMembers = memberCount >= 3;
  const canSubmit = !hasPendingInvites && hasMinMembers;

  const checkRequirements = () => {
    const requirements = [
      {
        condition: hasMinMembers,
        text: "تعداد اعضا (حداقل ۳ نفر)",
        current: `${memberCount} نفر`,
      },
      {
        condition: !hasPendingInvites,
        text: "عدم وجود دعوت‌های در انتظار",
        current: `${pendingInvites} دعوت`,
      },
      {
        condition: teamStatus === "draft",
        text: "تیم در حالت پیش‌نویس باشد",
        current: teamStatus === "draft" ? "مناسب" : "نامناسب",
      },
    ];

    return requirements;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(canSubmit ? 3 : 2);
    } else if (currentStep === 2 && canSubmit) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleFinalSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const success = await onSubmit();
      setSubmitResult({
        success,
        message: success
          ? "تیم با موفقیت ثبت نهایی شد. منتظر تأیید ادمین‌ها باشید."
          : "خطا در ثبت نهایی تیم. لطفاً دوباره تلاش کنید.",
      });
    } catch (error: any) {
      setSubmitResult({
        success: false,
        message: error?.message || "خطای ناشناخته رخ داده است.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setCurrentStep(1);
      setSubmitResult(null);
    }, 300);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <span
              className={`badge ${
                currentStep === stepNum
                  ? "badge-cyan"
                  : currentStep > stepNum
                    ? "badge-success"
                    : "badge-neutral"
              }`}
            >
              {currentStep > stepNum ? (
                <CheckCircle className="icon-sm" aria-hidden="true" />
              ) : (
                stepNum
              )}
            </span>
            {stepNum < 3 && (
              <span
                className="w-12 h-0.5 mx-2"
                style={{
                  background:
                    currentStep > stepNum ? "var(--success)" : "var(--border)",
                }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStepContent = () => {
    const requirements = checkRequirements();

    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="row">
              <span className="stat-icon is-cyan" aria-hidden="true">
                <AlertCircle className="icon" />
              </span>
              <div>
                <h3 className="card-title">آمادگی برای ثبت نهایی</h3>
                <p className="small text-muted">مرحله ۱ از ۳</p>
              </div>
            </div>

            <div className="stack">
              <div className="card">
                <h4 className="card-title row">
                  <Users className="icon-sm" aria-hidden="true" />
                  {teamName}
                </h4>
                <p className="card-text">
                  برای ثبت نهایی تیم خود، لطفاً شرایط زیر را بررسی کنید.
                </p>
              </div>

              <div className="payment-cell row between">
                <span className="text-muted">تعداد اعضای فعلی:</span>
                <strong>{memberCount} نفر</strong>
              </div>

              <div className="payment-cell row between">
                <span className="text-muted">دعوت‌های در انتظار:</span>
                <strong
                  className={
                    hasPendingInvites ? "text-danger" : "text-success"
                  }
                >
                  {pendingInvites} دعوت
                </strong>
              </div>

              {!canSubmit && (
                <div className="alert alert-danger">
                  <span className="alert-icon" aria-hidden="true">
                    <AlertTriangle className="icon icon-sm" />
                  </span>
                  <div>
                    <p className="alert-title">شرایط لازم رعایت نشده است</p>
                    <p>برای ادامه، لطفاً شرایط لازم را برطرف کنید.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={handleClose}
              >
                انصراف
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={handleNextStep}
              >
                بررسی شرایط
                <ChevronRight className="icon-sm" aria-hidden="true" />
              </button>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="row">
              <span className="stat-icon is-yellow" aria-hidden="true">
                <AlertTriangle className="icon" />
              </span>
              <div>
                <h3 className="card-title">بررسی شرایط</h3>
                <p className="small text-muted">مرحله ۲ از ۳</p>
              </div>
            </div>

            <div className="stack">
              <p className="card-text">
                قبل از ثبت نهایی، لطفاً شرایط زیر را بررسی کنید:
              </p>

              {requirements.map((req, index) => (
                <div className="payment-cell row between" key={index}>
                  <span className="row">
                    {req.condition ? (
                      <CheckCircle
                        className="icon-sm text-success"
                        aria-hidden="true"
                      />
                    ) : (
                      <X className="icon-sm text-danger" aria-hidden="true" />
                    )}
                    <span className="small">{req.text}</span>
                  </span>
                  <span
                    className={`small ${
                      req.condition ? "text-success" : "text-danger"
                    }`}
                  >
                    {req.current}
                  </span>
                </div>
              ))}

              {!canSubmit && (
                <div className="alert alert-danger">
                  <span className="alert-icon" aria-hidden="true">
                    <AlertTriangle className="icon icon-sm" />
                  </span>
                  <div>
                    <p className="alert-title">اقدامات لازم:</p>
                    <ul className="small">
                      {hasPendingInvites && (
                        <li>• دعوت‌نامه‌های در انتظار را مدیریت کنید</li>
                      )}
                      {!hasMinMembers && (
                        <li>• تعداد اعضای تیم را به حداقل ۳ نفر برسانید</li>
                      )}
                      {teamStatus !== "draft" && (
                        <li>• تیم باید در حالت پیش‌نویس باشد</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={handlePrevStep}
              >
                بازگشت
              </button>
              <button
                type="button"
                className={`btn flex-1 ${
                  canSubmit ? "btn-success" : "btn-secondary"
                }`}
                onClick={handleNextStep}
                disabled={!canSubmit}
              >
                {canSubmit ? (
                  <>
                    ادامه به تأیید نهایی
                    <ChevronRight className="icon-sm" aria-hidden="true" />
                  </>
                ) : (
                  "شرایط رعایت نشده"
                )}
              </button>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className="row">
              <span className="stat-icon is-green" aria-hidden="true">
                <CheckCircle className="icon" />
              </span>
              <div>
                <h3 className="card-title">تأیید نهایی</h3>
                <p className="small text-muted">مرحله ۳ از ۳</p>
              </div>
            </div>

            {submitResult ? (
              <div className="stack">
                <div
                  className={`alert ${
                    submitResult.success ? "alert-success" : "alert-danger"
                  }`}
                >
                  <span className="alert-icon" aria-hidden="true">
                    {submitResult.success ? (
                      <CheckCircle className="icon icon-sm" />
                    ) : (
                      <X className="icon icon-sm" />
                    )}
                  </span>
                  <div>
                    <p className="alert-title">
                      {submitResult.success ? "عملیات موفق" : "عملیات ناموفق"}
                    </p>
                    <p>{submitResult.message}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={handleClose}
                >
                  {submitResult.success ? "متوجه شدم" : "تلاش مجدد"}
                </button>
              </div>
            ) : (
              <>
                <div className="stack">
                  <div className="alert alert-warning">
                    <span className="alert-icon" aria-hidden="true">
                      <AlertTriangle className="icon icon-sm" />
                    </span>
                    <div>
                      <p className="alert-title">هشدار مهم!</p>
                      <ul className="small">
                        <li>
                          • پس از ثبت نهایی، امکان ویرایش تیم وجود نخواهد داشت
                        </li>
                        <li>• امکان دعوت عضو جدید غیرفعال می‌شود</li>
                        <li>• این عمل غیرقابل بازگشت است</li>
                        <li>
                          • اطلاعات تیم برای بررسی به ادمین‌ها ارسال می‌شود
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="card text-center">
                    <p className="card-text">
                      آیا مطمئن هستید که می‌خواهید تیم زیر را ثبت نهایی کنید؟
                    </p>
                    <h4 className="card-title">{teamName}</h4>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-ghost flex-1"
                    onClick={handlePrevStep}
                    disabled={submitting}
                  >
                    بازگشت
                  </button>
                  <button
                    type="button"
                    className="btn btn-success flex-1"
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner" aria-hidden="true" />
                        در حال ثبت نهایی...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="icon-sm" aria-hidden="true" />
                        ثبت نهایی تیم
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        );
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={!submitting && !submitResult}
      closeOnOverlayClick={!submitting}
      showHeader
      title="ثبت نهایی تیم"
      icon={<CheckCircle className="icon" />}
    >
      {renderStepIndicator()}
      {renderStepContent()}
    </BaseModal>
  );
};

export default SubmitTeamModal;
