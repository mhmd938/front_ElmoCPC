// src/pages/Dashboard/components/OverviewSection/PaymentInfoSection.tsx
import { Receipt, Upload } from "lucide-react";
import { USE_MOCKS } from "@/services/mock/flags";
import MockPaymentInstructions from "../Common/MockPaymentInstructions";

interface PaymentInfoSectionProps {
  paymentInfo?: {
    ticketPrice: number;
    cardNumber: string;
    bankName: string;
  };
  formatPrice: (price: number) => string;
  onUploadReceipt: () => void;
}

const PaymentInfoSection = ({
  paymentInfo,
  formatPrice,
  onUploadReceipt,
}: PaymentInfoSectionProps) => {
  return (
    <section className="card payment-card stack" aria-labelledby="payment-title">
      <div className="row">
        <span className="stat-icon is-yellow" aria-hidden="true">
          <Receipt className="icon" />
        </span>
        <h2 className="card-title" id="payment-title">
          آپلود فیش پرداخت
        </h2>
      </div>

      {USE_MOCKS ? <MockPaymentInstructions /> : (
        <>
          <div className="payment-grid">
            <div className="payment-cell">
              <p className="payment-label">مبلغ قابل پرداخت</p>
              <p className="payment-amount">
                {paymentInfo?.ticketPrice != null ? formatPrice(paymentInfo.ticketPrice) : "—"}
              </p>
            </div>
            <div className="payment-cell">
              <p className="payment-label">شماره کارت</p>
              <p className="payment-number" dir="ltr">
                {paymentInfo?.cardNumber || "—"}
              </p>
              <p className="payment-bank">{paymentInfo?.bankName}</p>
            </div>
          </div>

          <p className="payment-hint">
            لطفا پس از واریز مبلغ، فیش پرداخت را آپلود کنید.
          </p>
        </>
      )}

      <div>
        <button type="button" className="btn btn-secondary" onClick={onUploadReceipt}>
          <Upload className="icon-sm" aria-hidden="true" />
          آپلود فیش
        </button>
      </div>
    </section>
  );
};

export default PaymentInfoSection;
