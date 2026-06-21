import { useAuth } from "../../hooks/useAuth.jsx";
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Input from "../../components/input.jsx";
import Toast from "../../components/toast.jsx";
import { useToast } from "../../hooks/useToast.jsx";
import Spinner from "../../components/spinner.jsx";


export default function Register() {
  const [formFields, setFormFields] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldError, setFieldError] = useState({
    username: null,
    email: null,
    password: null,
    confirmPassword: null,
  });
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false); // FIX: redirecting state
  const { toast, showToast } = useToast();
  const { user, handleRegister, error } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/upload" replace />;

  useEffect(() => {
    if (error) showToast(error, false);
  }, [error]);

  function handleFieldChange(e) {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
    if (name === "username") {
      setFieldError((prev) => ({
        ...prev,
        username: !value ? "Username cannot be empty" : null,
      }));
    }
    if (name === "email") {
      if (!value) {
        setFieldError((prev) => ({ ...prev, email: "Email cannot be empty" }));
      } else {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        setFieldError((prev) => ({
          ...prev,
          email: regex.test(value)
            ? null
            : "Please enter a valid email address",
        }));
      }
    }
    if (name === "password") {
      if (!value) {
        setFieldError((prev) => ({
          ...prev,
          password: "Password cannot be empty",
        }));
      } else {
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        setFieldError((prev) => ({
          ...prev,
          password: passwordRegex.test(value)
            ? null
            : "Min 8 chars with uppercase, lowercase, digit, and special character",
        }));
      }
    }
    if (name === "confirmPassword") {
      setFieldError((prev) => ({
        ...prev,
        confirmPassword: !value
          ? "Confirm password cannot be empty"
          : formFields.password !== value
            ? "Passwords do not match"
            : null,
      }));
    }
  }

  function handleReset() {
    setFormFields({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setFieldError({
      username: null,
      email: null,
      password: null,
      confirmPassword: null,
    });
  }

  async function handleSubmit() {
    if (
      !formFields.username ||
      !formFields.email ||
      !formFields.password ||
      !formFields.confirmPassword
    ) {
      showToast("All fields are required.", false);
      return;
    }
    if (
      fieldError.username ||
      fieldError.email ||
      fieldError.password ||
      fieldError.confirmPassword
    ) {
      showToast("Please fix the errors.", false);
      return;
    }
    try {
      setLoading(true);
      const success = await handleRegister(
        formFields.username,
        formFields.email,
        formFields.password,
      );
      if (success) {
        setRedirecting(true); // FIX: show redirecting message before navigating
        navigate("/upload");
      } else {
        showToast("Registration failed. Try again.", false);
      }
    } catch {
      showToast("Something went wrong.", false);
    } finally {
      setLoading(false);
    }
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
       <Spinner className="w-12 h-12" />
        <p className="text-sm text-zinc-500 font-mono">
          Setting up your account…
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex font-mono">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-zinc-50 border-r border-zinc-200 p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(rgba(14,165,233,0.25) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(14,165,233,0.25) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-100 rounded-full blur-3xl pointer-events-none" />

        <span
          className="relative text-sky-600 font-bold tracking-widest text-sm uppercase cursor-pointer"
          onClick={() => navigate("/")}
        >
          ← SixSecondCV
        </span>

        <div className="relative flex flex-col gap-6">
          <span className="text-xs text-sky-600 tracking-widest uppercase">
            What you're getting
          </span>
          {[
            {
              emoji: "🤖",
              label: "ATS parse simulator with side-by-side view",
            },
            { emoji: "🎯", label: "JD match score + concrete gap list" },
            { emoji: "🔥", label: "6-second recruiter heatmap overlay" },
            { emoji: "📡", label: "ColdReach with live company intelligence" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 py-2 border-b border-zinc-200"
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-zinc-600 text-sm">{item.label}</span>
            </div>
          ))}
        </div>

        <p className="relative text-zinc-400 text-xs">© 2026 SixSecondCV</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col gap-7">
          <span
            className="lg:hidden text-sky-600 font-bold tracking-widest text-sm uppercase cursor-pointer"
            onClick={() => navigate("/")}
          >
            ← SixSecondCV
          </span>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-zinc-800">
              Create your account.
            </h1>
            <p className="text-zinc-500 text-sm">
              Start seeing what others can't.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Input
              label="Username"
              placeholder="yourhandle"
              value={formFields.username}
              name="username"
              onChange={handleFieldChange}
              error={fieldError.username}
              disabled={loading}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={formFields.email}
              name="email"
              onChange={handleFieldChange}
              error={fieldError.email}
              disabled={loading}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formFields.password}
              name="password"
              onChange={handleFieldChange}
              error={fieldError.password}
              disabled={loading}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={formFields.confirmPassword}
              name="confirmPassword"
              onChange={handleFieldChange}
              error={fieldError.confirmPassword}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-150"
            >
              {loading ? "Creating account…" : "Create Account →"}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full border border-zinc-200 hover:border-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-500 hover:text-zinc-700 font-medium py-3 rounded-xl transition-colors duration-150"
            >
              Reset
            </button>
          </div>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-sky-600 hover:text-sky-700 font-medium transition-colors duration-150"
            >
              Log in
            </button>
          </p>
        </div>
      </div>

      {toast.show && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toast.message} success={toast.success} />
        </div>
      )}
    </div>
  );
}
