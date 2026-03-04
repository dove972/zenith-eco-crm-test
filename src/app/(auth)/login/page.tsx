"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Erreur lors de la connexion");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      router.push("/admin");
    } else if (profile?.role === "manager") {
      router.push("/manager/dashboard");
    } else {
      router.push("/commercial/simulations");
    }

    router.refresh();
  }

  async function handleForgotPassword() {
    if (!forgotEmail.trim()) {
      setForgotError("Veuillez saisir votre adresse email");
      return;
    }
    setForgotSending(true);
    setForgotError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.trim(),
      { redirectTo: `${window.location.origin}/login` }
    );

    if (error) {
      setForgotError("Erreur lors de l'envoi. Vérifiez votre adresse email.");
    } else {
      setForgotSent(true);
    }
    setForgotSending(false);
  }

  return (
    <main className="flex min-h-screen" style={{ background: "#F2F0ED" }}>
      <div
        className="hidden w-[45%] lg:flex items-center justify-center relative overflow-hidden"
        style={{ background: "#333" }}
      >
        <div
          className="absolute -top-[30%] -right-[20%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(250,120,0,0.1), transparent 70%)" }}
        />
        <div className="relative text-center px-12">
          <Image
            src="/logo-zenith.png"
            alt="Zenith Eco"
            width={200}
            height={100}
            className="mx-auto object-contain"
            priority
          />
          <p className="mt-6 text-white/40 text-sm font-medium leading-relaxed max-w-xs mx-auto">
            Votre outil de simulation et de gestion commerciale
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex justify-center lg:hidden">
            <Image
              src="/logo-zenith.png"
              alt="Zenith Eco"
              width={150}
              height={75}
              className="object-contain"
              priority
            />
          </div>

          <div className="rounded-[14px] bg-white p-8 shadow-card">
            {forgotMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setForgotSent(false);
                    setForgotError(null);
                  }}
                  className="mb-4 flex items-center gap-1.5 text-sm font-medium text-[#888] hover:text-[#464646] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </button>

                {forgotSent ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-[#43A047] mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-[#464646] mb-2">
                      Email envoyé
                    </h2>
                    <p className="text-sm text-[#888]">
                      Un lien de réinitialisation a été envoyé à{" "}
                      <strong className="text-[#464646]">{forgotEmail}</strong>.
                      Vérifiez votre boîte de réception.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h1 className="text-[1.3rem] font-extrabold text-[#464646]">
                        Mot de passe oublié
                      </h1>
                      <p className="text-sm text-[#888] mt-1">
                        Saisissez votre email pour recevoir un lien de
                        réinitialisation
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-[13px] font-bold text-[#464646]">
                          Email
                        </label>
                        <input
                          type="email"
                          autoComplete="email"
                          className="w-full rounded-[10px] border border-[#E0E0E0] bg-white px-4 py-3.5 text-sm text-[#333] transition-all placeholder:text-[#ccc] focus:border-[#FA7800] focus:outline-none focus:ring-2 focus:ring-[#FA7800]/15"
                          placeholder="nom@zenitheco.fr"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleForgotPassword()
                          }
                        />
                      </div>

                      {forgotError && (
                        <div
                          className="rounded-[10px] bg-[#FFEBEE] px-4 py-3 text-sm font-medium text-[#E53935]"
                          style={{ borderLeft: "4px solid #E53935" }}
                        >
                          {forgotError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={forgotSending}
                        className="flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-[#FA7800] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#e06e00] active:scale-[0.98] disabled:opacity-50"
                      >
                        {forgotSending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Envoyer le lien
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-[1.5rem] font-extrabold text-[#464646]">
                    Connexion
                  </h1>
                  <p className="text-sm text-[#888] mt-1">
                    Accédez à votre espace professionnel
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-[13px] font-bold text-[#464646]"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="w-full rounded-[10px] border border-[#E0E0E0] bg-white px-4 py-3.5 text-sm text-[#333] transition-all placeholder:text-[#ccc] focus:border-[#FA7800] focus:outline-none focus:ring-2 focus:ring-[#FA7800]/15"
                      placeholder="nom@zenitheco.fr"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs font-medium text-[#E53935]">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="text-[13px] font-bold text-[#464646]"
                      >
                        Mot de passe
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-[12px] font-medium text-[#FA7800] hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      className="w-full rounded-[10px] border border-[#E0E0E0] bg-white px-4 py-3.5 text-sm text-[#333] transition-all focus:border-[#FA7800] focus:outline-none focus:ring-2 focus:ring-[#FA7800]/15"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="mt-1.5 text-xs font-medium text-[#E53935]">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {error && (
                    <div
                      className="rounded-[10px] bg-[#FFEBEE] px-4 py-3 text-sm font-medium text-[#E53935]"
                      style={{ borderLeft: "4px solid #E53935" }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-[#FA7800] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#e06e00] active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Se connecter
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-[11px] text-[#ccc] font-medium">
            ZENITH ECO by ENR FREE — Groupe GDU Holding
          </p>
        </div>
      </div>
    </main>
  );
}
