import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Wallet, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function RegisterPage() {
  const { signUp, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // If already logged in, redirect
  if (authLoading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password match
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message || "Gagal mendaftar. Silakan coba lagi.");
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-dvh bg-dark-900 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-4 glow-primary">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-dark-100 mb-2">
          Cek Email Anda!
        </h2>
        <p className="text-dark-400 text-sm text-center max-w-xs mb-6">
          Kami telah mengirim link verifikasi ke{" "}
          <strong className="text-dark-200">{email}</strong>. Silakan cek inbox
          Anda.
        </p>
        <Link to="/login">
          <Button variant="secondary">Kembali ke Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-dark-900 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-4 glow-primary">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gradient">Dompetan</h1>
        <p className="text-dark-400 text-sm mt-1">Buat akun baru</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-expense/10 border border-expense/20 text-expense text-sm text-center">
            {error}
          </div>
        )}

        <Input
          type="email"
          label="Email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4" />}
          required
          autoComplete="email"
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-dark-400 hover:text-dark-200 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <Input
          type={showPassword ? "text" : "password"}
          label="Konfirmasi Password"
          placeholder="Ulangi password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
          autoComplete="new-password"
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          size="lg"
          icon={<UserPlus className="w-4 h-4" />}
        >
          Daftar
        </Button>

        <p className="text-center text-sm text-dark-400">
          Sudah punya akun?{" "}
          <Link
            to="/login"
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            Masuk di sini
          </Link>
        </p>
      </form>
    </div>
  );
}
