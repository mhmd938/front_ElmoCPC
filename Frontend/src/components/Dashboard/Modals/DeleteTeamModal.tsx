import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import BaseModal from "./BaseModal";

interface DeleteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  onConfirm: () => Promise<boolean>;
}

const DeleteTeamModal = ({
  isOpen,
  onClose,
  teamName,
  onConfirm,
}: DeleteTeamModalProps) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      if (await onConfirm()) onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={deleting ? () => {} : onClose}
      showHeader
      title="حذف تیم"
      icon={<Trash2 className="icon" />}
      closeOnOverlayClick={!deleting}
      showCloseButton={!deleting}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={deleting}>
            انصراف
          </button>
          <button type="button" className="btn btn-destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? "در حال حذف..." : "حذف تیم"}
          </button>
        </>
      }
    >
      <div className="alert alert-danger">
        <span className="alert-icon" aria-hidden="true">
          <AlertTriangle className="icon icon-sm" />
        </span>
        <div>
          <p className="alert-title">این عملیات قابل بازگشت نیست</p>
          <p>آیا از حذف تیم «{teamName}» مطمئن هستید؟</p>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteTeamModal;
