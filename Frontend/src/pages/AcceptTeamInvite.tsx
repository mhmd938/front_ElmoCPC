import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";
import ELMOCPC from "@/assets/ELMOCPC.svg";
import CESA from "@/assets/CESA.svg";
import {
  acceptInviteService,
  rejectInviteService,
} from "@/services/teamService";

function AcceptTeamInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

  const handleAcceptTeamInvite = async () => {
    try {
      if (!token) {
        toast.error("توکن دعوت یافت نشد");
        return;
      }

      // if (!checkAuthentication()) {
      //   return;
      // }

      setLoading(true);
      setError(null);

      await acceptInviteService(token);

      toast.success("شما با موفقیت به تیم اضافه شدید!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Error accepting team invite:", err);

      let errorMsg = "خطا در قبول دعوت";

      if (err.response?.data) {
        const data = err.response.data;

        if (data.messages) {
          errorMsg =
            Object.values(data.messages)
              .flatMap((m: any) => Object.values(m))
              .join(", ") || errorMsg;
        } else if (data.message) {
          errorMsg = data.message;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTeamInvite = async () => {
    try {
      if (!token) {
        toast.error("توکن دعوت یافت نشد");
        return;
      }

      // if (!checkAuthentication()) {
      //   return;
      // }

      setLoading(true);
      setError(null);

      await rejectInviteService(token);

      toast.success("دعوت رد شد");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      console.error("Error rejecting team invite:", err);

      let errorMsg = "خطا در رد کردن دعوت";

      if (err?.messages) {
        // هندل کردن ارورهای مختلف
        if (err.messages.invitation?.["already rejected"]) {
          errorMsg = "این دعوت قبلاً رد شده است";
        } else if (err.messages.invitation?.["already accepted"]) {
          errorMsg = "این دعوت قبلاً قبول شده است";
        } else if (err.messages.invitation?.["expired"]) {
          errorMsg = "این دعوت منقضی شده است";
        } else if (err.messages.invitation?.["not found"]) {
          errorMsg = "دعوت یافت نشد";
        } else {
          errorMsg = Object.values(err.messages).flat().join(", ") || errorMsg;
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // const checkAuthentication = () => {
  //   const accessToken = localStorage.getItem("access_token");
  //   if (!accessToken) {
  //     toast.error("لطفا ابتدا وارد حساب کاربری خود شوید");
  //     navigate("/login", {
  //       state: {
  //         redirectTo: `/accept-invite?token=${token}`,
  //       },
  //     });
  //     return false;
  //   }
  //   return true;
  // };

  if (!token) {
    return (
      <main className="auth-page" dir="rtl">
        <section className="auth-card" aria-labelledby="accept-error-title">
          <header className="form-header">
            <span className="form-icon form-icon-round" aria-hidden="true">
              <AlertCircle className="icon-lg" />
            </span>
            <h1 className="form-title" id="accept-error-title">
              خطا در پردازش دعوت
            </h1>
            <p className="form-desc">توکن دعوت یافت نشد</p>
          </header>

          <div className="form-actions form-actions-fill">
            <button
              type="button"
              className="btn btn-yellow btn-lg"
              onClick={() => navigate("/login")}
            >
              بازگشت به لاگین
            </button>
          </div>
        </section>

        <a href="/">
          <img
            className="corner-logo corner-logo-start"
            src={ELMOCPC}
            alt="ELMOCPC"
          />
        </a>
        <img
          className="corner-logo corner-logo-end"
          src={CESA}
          alt="CESA"
        />
      </main>
    );
  }

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-card" aria-labelledby="accept-title">
        <header className="form-header">
          <span className="form-icon form-icon-round" aria-hidden="true">
            <Users className="icon-lg" />
          </span>
          <h1 className="form-title" id="accept-title">
            دعوت به تیم
          </h1>
          <p className="form-desc">آیا می‌خواهید به این تیم اضافه شوید؟</p>
        </header>

        {error && (
          <div className="alert alert-danger" role="alert">
            <span className="alert-icon" aria-hidden="true">
              <AlertCircle className="icon icon-sm" />
            </span>
            <p>{error}</p>
          </div>
        )}

        <div className="form-actions form-actions-fill">
          <button
            type="button"
            className="btn btn-yellow btn-lg"
            onClick={handleAcceptTeamInvite}
            disabled={loading}
          >
            {loading ? "درحال پردازش..." : "قبول دعوت"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-lg"
            onClick={handleRejectTeamInvite}
            disabled={loading}
          >
            رد کردن
          </button>
        </div>
      </section>

      <a href="/">
        <img
          className="corner-logo corner-logo-start"
          src={ELMOCPC}
          alt="ELMOCPC"
        />
      </a>
      <img className="corner-logo corner-logo-end" src={CESA} alt="CESA" />
    </main>
  );
}

export default AcceptTeamInvite;
