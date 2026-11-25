import Image from "next/image";
import { LoginForm } from "@/components/login/login-form";
import { withBasePath } from "@/lib/base-path";

export default function LoginPage() {
  return (
    <main className="clinic-theme clinic-login">
      <aside className="clinic-login-brand">
        <Image
          src={withBasePath("/images/eagle-lens-1600.webp")}
          alt=""
          fill
          sizes="(min-width: 768px) 40vw, 0px"
          className="clinic-login-photo"
        />
        <div className="sidebar-brand">
          <Image
            src={withBasePath("/icon.png")}
            alt=""
            width={40}
            height={40}
            priority
          />
          <div>
            <p>Eagel eye</p>
            <span>by Eagle Eye Tech Ltd</span>
          </div>
        </div>
        <p className="clinic-login-summary">
          Retinal screening for your clinic
        </p>
      </aside>

      <section
        aria-labelledby="login-title"
        className="dashboard-card clinic-login-card"
      >
        <header className="dashboard-heading">
          <h1 id="login-title">Welcome to Eagle Lense</h1>
        </header>
        <LoginForm />
      </section>
    </main>
  );
}
