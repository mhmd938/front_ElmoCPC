import { useState } from "react";
import { Formik, Form, Field, type FieldProps } from "formik";
import * as Yup from "yup";
import { UserPlus, Send, ArrowLeft, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { inviteUserService } from "@/services/teamService";
import type { InviteUserPayload } from "@/types/teamTypes";
import ELMOCPC from "@/assets/ELMOCPC.svg";
import CESA from "@/assets/CESA.svg";

// Validation schema برای اطلاعات عضو
const memberValidationSchema = Yup.object({
  name: Yup.string()
    .min(2, "نام باید حداقل ۲ حرف باشد")
    .max(50, "نام نباید بیشتر از ۵۰ حرف باشد")
    .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/, "نام فقط می‌تواند شامل حروف باشد")
    .required("نام الزامی است"),

  familyName: Yup.string()
    .min(2, "نام خانوادگی باید حداقل ۲ حرف باشد")
    .max(50, "نام خانوادگی نباید بیشتر از ۵۰ حرف باشد")
    .matches(
      /^[\u0600-\u06FFa-zA-Z\s]+$/,
      "نام خانوادگی فقط می‌تواند شامل حروف باشد"
    )
    .required("نام خانوادگی الزامی است"),

  email: Yup.string()
    .email("فرمت ایمیل معتبر نیست")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "ایمیل معتبر وارد کنید"
    )
    .required("ایمیل الزامی است"),

  phone: Yup.string()
    .matches(/^09[0-9]{9}$/, "شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد")
    .required("شماره موبایل الزامی است"),

  university: Yup.string()
    .min(3, "نام دانشگاه باید حداقل ۳ حرف باشد")
    .required("نام دانشگاه الزامی است"),

  nationalCode: Yup.string()
    .matches(/^[0-9]{10}$/, "کد ملی باید ۱۰ رقم باشد")
    .required("کد ملی الزامی است"),

  tshirtSize: Yup.string().optional(),
});

interface MemberData {
  name: string;
  familyName: string;
  email: string;
  phone: string;
  university: string;
  nationalCode?: string;
  tshirtSize?: string;
}

function InviteMember() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues: MemberData = {
    name: "",
    familyName: "",
    email: "",
    phone: "",
    university: "",
    nationalCode: "",
    tshirtSize: "M",
  };

  const handleInviteMember = async (values: MemberData) => {
    try {
      setIsSubmitting(true);

      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("توکن یافت نشد. لطفا دوباره وارد شوید.");
        navigate("/login");
        return;
      }

      // دریافت teamId از localStorage یا props
      const teamId = localStorage.getItem("teamId");
      console.log("🏷️ teamId:", teamId);

      if (!teamId) {
        toast.error("تیم یافت نشد. لطفا ابتدا تیم ایجاد کنید.");
        navigate("/dashboard");
        return;
      }

      const invitePayload: InviteUserPayload = {
        members: [
          {
            first_name: values.name,
            last_name: values.familyName,
            email: values.email,
            phone: values.phone,
            university: values.university,
            national_code: values.nationalCode || "",
            tshirt_size: values.tshirtSize || "M",
          },
        ],
      };

      console.log("📨 ارسال دعوت:", invitePayload);
      await inviteUserService(teamId.toString(), invitePayload);

      toast.success("دعوت با موفقیت ارسال شد!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("❌ خطا در ارسال دعوت:", error);

      if (error.response?.status === 400) {
        const errorMessage =
          error.response?.data?.message || error.response?.data?.error;
        toast.error(errorMessage || "خطا در اطلاعات وارد شده");
      } else {
        toast.error(
          error?.message || "خطا در ارسال دعوت. لطفا دوباره تلاش کنید"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-card auth-card-2xl" aria-labelledby="invite-title">
        <header className="form-header">
          <span className="form-icon" aria-hidden="true">
            <UserPlus className="icon-lg" />
          </span>
          <h1 className="form-title" id="invite-title">
            دعوت عضو جدید
          </h1>
          <p className="form-desc">
            اطلاعات عضو جدید را وارد کنید تا دعوت‌نامه برای او ارسال شود
          </p>
        </header>

        <Formik
          initialValues={initialValues}
          validationSchema={memberValidationSchema}
          onSubmit={handleInviteMember}
        >
          {({ isSubmitting: formSubmitting }) => (
            <Form>
              <div className="form-stack">
                <div className="form-grid">
                  <Field name="name">
                    {({ field, meta }: FieldProps) => (
                      <div>
                        <div className="fl">
                          <input
                            {...field}
                            id="invite-name"
                            className="input fl-control"
                            type="text"
                            placeholder=" "
                            autoComplete="given-name"
                          />
                          <label className="fl-label" htmlFor="invite-name">
                            نام
                          </label>
                        </div>
                        {meta.touched && meta.error && (
                          <p className="field-error">{meta.error}</p>
                        )}
                      </div>
                    )}
                  </Field>

                  <Field name="familyName">
                    {({ field, meta }: FieldProps) => (
                      <div>
                        <div className="fl">
                          <input
                            {...field}
                            id="invite-family"
                            className="input fl-control"
                            type="text"
                            placeholder=" "
                            autoComplete="family-name"
                          />
                          <label className="fl-label" htmlFor="invite-family">
                            نام خانوادگی
                          </label>
                        </div>
                        {meta.touched && meta.error && (
                          <p className="field-error">{meta.error}</p>
                        )}
                      </div>
                    )}
                  </Field>

                  <Field name="email">
                    {({ field, meta }: FieldProps) => (
                      <div>
                        <div className="fl">
                          <input
                            {...field}
                            id="invite-email"
                            className="input fl-control"
                            type="email"
                            dir="ltr"
                            placeholder=" "
                            autoComplete="email"
                          />
                          <label className="fl-label" htmlFor="invite-email">
                            ایمیل
                          </label>
                        </div>
                        {meta.touched && meta.error && (
                          <p className="field-error">{meta.error}</p>
                        )}
                      </div>
                    )}
                  </Field>

                  <Field name="phone">
                    {({ field, meta }: FieldProps) => (
                      <div>
                        <div className="fl">
                          <input
                            {...field}
                            id="invite-phone"
                            className="input fl-control"
                            type="tel"
                            dir="ltr"
                            placeholder=" "
                            autoComplete="tel"
                            maxLength={11}
                          />
                          <label className="fl-label" htmlFor="invite-phone">
                            شماره موبایل
                          </label>
                        </div>
                        {meta.touched && meta.error && (
                          <p className="field-error">{meta.error}</p>
                        )}
                      </div>
                    )}
                  </Field>

                  <Field name="university">
                    {({ field, meta }: FieldProps) => (
                      <div>
                        <div className="fl">
                          <input
                            {...field}
                            id="invite-university"
                            className="input fl-control"
                            type="text"
                            placeholder=" "
                          />
                          <label className="fl-label" htmlFor="invite-university">
                            نام دانشگاه
                          </label>
                        </div>
                        {meta.touched && meta.error && (
                          <p className="field-error">{meta.error}</p>
                        )}
                      </div>
                    )}
                  </Field>

                  <Field name="nationalCode">
                    {({ field, meta }: FieldProps) => (
                      <div>
                        <div className="fl">
                          <input
                            {...field}
                            id="invite-national-id"
                            className="input fl-control"
                            type="text"
                            placeholder=" "
                            maxLength={10}
                          />
                          <label
                            className="fl-label"
                            htmlFor="invite-national-id"
                          >
                            کد ملی
                          </label>
                        </div>
                        {meta.touched && meta.error && (
                          <p className="field-error">{meta.error}</p>
                        )}
                      </div>
                    )}
                  </Field>

                  <Field name="tshirtSize">
                    {({ field, meta }: FieldProps) => (
                      <div className="field">
                        <label className="label" htmlFor="invite-tshirt">
                          سایز تیشرت
                        </label>
                        <span className="select">
                          <select {...field} id="invite-tshirt">
                            <option value="">
                              سایز تیشرت را انتخاب کنید
                            </option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                          </select>
                          <ChevronDown
                            className="select-chevron icon-sm"
                            aria-hidden="true"
                          />
                        </span>
                        {meta.touched && meta.error && (
                          <p className="field-error">{meta.error}</p>
                        )}
                      </div>
                    )}
                  </Field>
                </div>

                <div className="form-actions form-actions-fill">
                  <button
                    type="submit"
                    className="btn btn-yellow btn-lg"
                    disabled={formSubmitting || isSubmitting}
                  >
                    <Send className="icon-sm" aria-hidden="true" />
                    {formSubmitting || isSubmitting
                      ? "در حال ارسال..."
                      : "ارسال دعوت"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-lg"
                    onClick={() => navigate("/dashboard")}
                  >
                    <ArrowLeft className="icon-sm" aria-hidden="true" />
                    بازگشت
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
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

export default InviteMember;
