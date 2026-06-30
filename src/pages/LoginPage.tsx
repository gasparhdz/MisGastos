import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword } from "@/features/auth/services/auth.service";

type LoginValues = {
  email: string;
  password: string;
};

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const redirectTo = locationState?.from?.pathname ?? "/";
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function submit(values: LoginValues) {
    setError(null);
    const { error: signInError } = await signInWithPassword(
      values.email.trim(),
      values.password,
    );

    if (signInError) {
      setError("No pude iniciar sesión. Revisá email y contraseña.");
      return;
    }

    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Mis Gastos</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal">Iniciar sesión</h1>
        </div>

        <Card className="shadow-none">
          <CardContent className="p-4">
            <form className="space-y-4" onSubmit={handleSubmit(submit)}>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  autoComplete="email"
                  inputMode="email"
                  placeholder="tu@email.com"
                  type="email"
                  {...register("email", { required: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input
                  autoComplete="current-password"
                  placeholder="••••••••"
                  type="password"
                  {...register("password", { required: true })}
                />
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  {error}
                </div>
              ) : null}

              <Button className="w-full" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
