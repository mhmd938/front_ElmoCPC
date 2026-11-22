// src/pages/Dashboard/components/Modals/UploadReceiptModal.tsx
import { useState, useCallback } from "react";
import { Upload, Receipt } from "lucide-react";
import BaseModal from "./BaseModal.tsx";

interface UploadReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<boolean>;
  paymentInfo: {
    ticketPrice: number;
    cardNumber: string;
    bankName: string;
  };
}

const UploadReceiptModal = ({
  isOpen,
  onClose,
  onUpload,
  paymentInfo,
}: UploadReceiptModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const formatPrice = (price: number) => {
    return (
      new Intl.NumberFormat("fa-IR").format(price) + " هزار تومان برای کل تیم"
    );
  };

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const isTypeAllowed =
      allowedTypes.includes(file.type) ||
      ["jpg", "jpeg", "png", "pdf"].includes(fileExtension || "");

    if (!isTypeAllowed) {
      alert("فرمت فایل مجاز نیست. فقط JPG, PNG, PDF قابل قبول است");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("حجم فایل باید کمتر از 5MB باشد");
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const success = await onUpload(selectedFile);
    setUploading(false);

    if (success) {
      onClose();
      setSelectedFile(null);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      showHeader
      title="آپلود فیش پرداخت"
      icon={<Upload className="icon" />}
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={uploading}
          >
            انصراف
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? "در حال آپلود..." : "آپلود فایل"}
          </button>
        </>
      }
    >
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

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className={`dropzone${isDragging ? " is-dragging" : ""}`}
        onClick={() => document.getElementById("receipt-input")?.click()}
      >
        <Receipt className="icon-lg" aria-hidden="true" />

        {!selectedFile ? (
          <>
            <p>فایل را اینجا رها کنید</p>
            <p className="small text-muted">یا کلیک کنید برای انتخاب</p>
          </>
        ) : (
          <p className="text-success">{selectedFile.name} انتخاب شد</p>
        )}

        <input
          id="receipt-input"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      <div className="text-center">
        <p className="small text-muted">فرمت‌های قابل قبول: JPG, PNG, PDF</p>
        <p className="small text-muted">حداکثر حجم: 5MB</p>
      </div>
    </BaseModal>
  );
};

export default UploadReceiptModal;
