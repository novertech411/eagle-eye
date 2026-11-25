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
          sizes="(min-width: 768px) 50vw, 0px"
          className="clinic-login-photo"
        />
        <div className="sidebar-brand">
          <Image
            src={withBasePath("/icon.png")}
            alt=""
            width={64}
            height={64}
            priority
          />
          <div>
            <p>EAGLE LENSE</p>
          </div>
        </div>
        <div className="clinic-login-summary">
          <h2>See the signs before sight is lost.</h2>
          {/* <p>
            Photograph the retina with a smartphone, screen for glaucoma or
            diabetic retinopathy with AI, and leave every patient with a clear
            next step.
          </p> */}
        </div>
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
