// src/pages/Dashboard/components/TeamSection/TeamStatusCard.tsx
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Receipt,
  Upload,
} from "lucide-react";

type StatusTone = "yellow" | "cyan" | "receipt" | "green" | "red";
type AlertTone =
  | "alert-warning"
  | "alert-info"
  | "alert-success"
  | "alert-danger";

interface TeamStatusCardProps {
  teamData: {
    status: string;
    receipt_image_url?: string;
  };
  formatPrice: (price: number) => string;
  paymentInfo: {
    ticketPrice: number;
    cardNumber: string;
    bankName: string;
  };
}

interface StatusConfig {
  icon: LucideIcon;
  title: string;
  tone: StatusTone;
  alert: AlertTone;
  description: string;
  steps: string[];
  note: string;
}

const statusConfig: Record<string, StatusConfig> = {
  draft: {
    icon: AlertCircle,
    title: "تیم در حالت پیش‌نویس",
    tone: "yellow",
    alert: "alert-warning",
    description:
      "ثبت‌نام شما هنوز تکمیل نشده است. برای تکمیل فرآیند ثبت‌نام، لطفاً مراحل زیر را انجام دهید:",
    steps: [
      "اعضای تیم را دعوت کنید (حداکثر ۳ نفر)",
      "منتظر بمانید تا اعضای دعوت شده invitation را قبول کنند",
      "پس از تکمیل اعضا، روی دکمه 'ثبت نهایی تیم' کلیک کنید",
      "پس از ثبت نهایی، منتظر تایید از سمت ادمین‌ها باشید سپس هزینه ثبت‌نام را پرداخت و فیش را آپلود کنید",
    ],
    note: "💡 توجه: تا زمانی که تیم در حالت پیش‌نویس است، امکان ویرایش اطلاعات تیم وجود دارد. پس از ثبت نهایی، ویرایش امکان‌پذیر نخواهد بود.",
  },
  submitted: {
    icon: Clock,
    title: "تیم ثبت نهایی شده است",
    tone: "cyan",
    alert: "alert-info",
    description:
      "تیم شما با موفقیت ثبت نهایی شد. در حال حاضر وضعیت شما به شرح زیر است:",
    steps: [
      "تیم شما برای بررسی به ادمین‌ها ارسال شده است",
      "لطفاً منتظر تایید نهایی از سوی ادمین‌ها باشید",
      "پس از تایید ادمین‌ها، می‌توانید هزینه ثبت‌نام را پرداخت کنید",
    ],
    note: "⏳ زمان بررسی معمولاً ۱ تا ۶ ساعت طول می‌کشد",
  },
  waiting_for_payment: {
    icon: Receipt,
    title: "در انتظار پرداخت",
    tone: "yellow",
    alert: "alert-warning",
    description:
      "تیم شما توسط ادمین‌ها تایید شده است. لطفاً برای تکمیل ثبت‌نام:",
    steps: [
      "هزینه ثبت‌نام را به شماره کارت مشخص شده واریز کنید",
      "پس از واریز، فیش پرداختی را در سیستم آپلود کنید",
      "پس از آپلود فیش، وضعیت شما به 'در انتظار تایید فیش' تغییر خواهد کرد",
    ],
    note: "",
  },
  receipt_pending: {
    icon: Upload,
    title: "در انتظار تایید فیش",
    tone: "receipt",
    alert: "alert-info",
    description: "فیش پرداختی شما در حال بررسی است. وضعیت فعلی:",
    steps: [
      "فیش پرداختی شما توسط ادمین‌ها در حال بررسی است",
      "پس از تایید فیش، وضعیت شما به 'تایید شده' تغییر خواهد کرد",
    ],
    note: "",
  },
  accepted: {
    icon: CheckCircle,
    title: "تیم تایید شده است",
    tone: "green",
    alert: "alert-success",
    description: "تبریک! ثبت‌نام شما با موفقیت تکمیل شد. وضعیت فعلی شما:",
    steps: [
      "تیم شما برای شرکت در مسابقه تایید شده است",
      "منتظر اطلاعیه‌های بعدی برای زمان مسابقه باشید",
    ],
    note: "🎉 موفق باشید در مسابقه!",
  },
  rejected: {
    icon: AlertTriangle,
    title: "تیم رد شده است",
    tone: "red",
    alert: "alert-danger",
    description: "متأسفانه تیم شما توسط ادمین‌ها رد شده است. دلایل احتمالی:",
    steps: [
      "مشکل در اطلاعات اعضای تیم",
      "فیش پرداختی نامعتبر",
      "عدم رعایت قوانین مسابقه",
    ],
    note: "📞 در صورت نیاز به اطلاعات بیشتر با پشتیبانی تماس بگیرید",
  },
};

const TeamStatusCard = ({
  teamData,
  formatPrice,
  paymentInfo,
}: TeamStatusCardProps) => {
  const config = statusConfig[teamData.status] || statusConfig.draft;
  const Icon = config.icon;
  const note =
    teamData.status === "waiting_for_payment"
      ? `💰 مبلغ قابل پرداخت: ${formatPrice(paymentInfo.ticketPrice)}`
      : config.note;

  return (
    <div className="stack">
      <section className="card stack" aria-labelledby="team-status-title">
        <div className="row">
          <span className={`stat-icon is-${config.tone}`} aria-hidden="true">
            <Icon className="icon" />
          </span>
          <h2 className="card-title" id="team-status-title">
            {config.title}
          </h2>
        </div>

        <p className="card-text">{config.description}</p>

        <ul className="status-steps">
          {config.steps.map((step) => (
            <li className="status-step" key={step}>
              <CheckCircle className="icon icon-sm" aria-hidden="true" />
              <span>{step}</span>
            </li>
          ))}
        </ul>

        {note && (
          <div className={`alert ${config.alert}`}>
            <span className="alert-icon" aria-hidden="true">
              <AlertTriangle className="icon icon-sm" />
            </span>
            <p>{note}</p>
          </div>
        )}
      </section>

      {teamData.status === "waiting_for_payment" && (
        <section className="card payment-card stack">
          <div className="row">
            <span className="stat-icon is-yellow" aria-hidden="true">
              <Receipt className="icon" />
            </span>
            <h2 className="card-title">اطلاعات پرداخت</h2>
          </div>

          <div className="payment-grid">
            <div className="payment-cell">
              <p className="payment-label">مبلغ قابل پرداخت</p>
              <p className="payment-amount">
                {formatPrice(paymentInfo.ticketPrice)}
              </p>
            </div>
            <div className="payment-cell">
              <p className="payment-label">شماره کارت</p>
              <p className="payment-number" dir="ltr">
                {paymentInfo.cardNumber}
              </p>
              <p className="payment-bank">{paymentInfo.bankName}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default TeamStatusCard;
