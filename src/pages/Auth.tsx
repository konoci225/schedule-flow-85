import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

import { Mail, Lock, School, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center">
            <School className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">EduSchedule</h1>
          <p className="text-muted-foreground">
            Gérez vos emplois du temps intelligemment
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
