import { Mail, Instagram, Send } from "lucide-react";
import cesa from "@/assets/CESA.svg";
import uni from "@/assets/UNi.png";
import elmocpc from "@/assets/ELMOCPC.svg";
import extraLogo from "@/assets/yektanet.svg";

const Footer = () => {
  return (
    <footer className="footer" id="contact">
      <div className="footer-inner">
        <div className="footer-contact">
          <h2 className="footer-heading">تماس با ما</h2>
          <p className="footer-text">
            برای اطلاعات بیشتر با ما در ارتباط باشید
          </p>
          <ul className="contact-links contact-links-icons">
            <li>
              <a className="contact-link contact-link-email" href="mailto:Elmocpc@outlook.com" aria-label="ایمیل Elmocpc@outlook.com">
                <Mail className="contact-icon" aria-hidden="true" />
                <span className="contact-tooltip" aria-hidden="true">ایمیل</span>
              </a>
            </li>
            <li>
              <a className="contact-link contact-link-telegram" href="https://t.me/iustacm" target="_blank" rel="noopener noreferrer" aria-label="تلگرام، آی‌یو‌اس‌تی‌ای‌سی‌ام">
                <Send className="contact-icon" aria-hidden="true" />
                <span className="contact-tooltip" aria-hidden="true">تلگرام</span>
              </a>
            </li>
            <li>
              <a className="contact-link contact-link-instagram" href="https://instagram.com/cesa_iust" target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام، سی‌ای‌اس‌ای آی‌یو‌اس‌تی">
                <Instagram className="contact-icon" aria-hidden="true" />
                <span className="contact-tooltip" aria-hidden="true">اینستاگرام</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-logos">
          <img className="footer-logo" src={cesa} alt="CESA" />
          <img className="footer-logo" src={uni} alt="UNI" />
          <img className="footer-logo" src={extraLogo} alt="Extra Logo" />
          <img className="footer-logo" src={elmocpc} alt="ELMOCPC" />
        </div>

        <div className="footer-copy">
          <p>ELMOCPC 2026 © - تمامی حقوق محفوظ است</p>
          <p>ELMOCPC - Computer Engineering Scientific Associate</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
