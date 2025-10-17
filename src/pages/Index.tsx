import { Button } from "@/components/ui/button";
import { ArrowRight, School, Users, Calendar, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <School className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              EduSchedule
            </span>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="gap-2">
              Connexion
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Shield className="h-4 w-4" />
            Solution Multi-Tenant Sécurisée
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
            Gérez vos emplois du temps{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              intelligemment
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plateforme SaaS complète pour automatiser et optimiser la gestion des emplois du temps 
            de votre établissement scolaire. Simple, puissant, et sécurisé.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/register-teacher">
              <Button size="lg" className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity">
                Inscription Professeur
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="gap-2">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <School className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Multi-Établissements</h3>
            <p className="text-muted-foreground">
              Gérez plusieurs établissements depuis une seule plateforme avec isolation complète des données.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold">Génération Automatique</h3>
            <p className="text-muted-foreground">
              Créez des emplois du temps optimisés en quelques clics avec notre système intelligent.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold">Gestion Complète</h3>
            <p className="text-muted-foreground">
              Professeurs, classes, salles, matières - tout est centralisé et facile à gérer.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © 2025 EduSchedule. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
