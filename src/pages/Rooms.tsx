import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, DoorOpen, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function Rooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    room_type: "",
    capacity: "",
    floor: "",
    building: "",
    equipment: "",
    is_available: true,
    description: "",
  });

  useEffect(() => {
    checkUserRole();
    fetchRooms();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roles) {
      setUserRole(roles.role);
    }
  };

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rooms")
      .select("*, schools(name)")
      .order("name");

    if (!error && data) {
      setRooms(data);
    } else if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les salles",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("school_id")
        .eq("user_id", user.id)
        .eq("role", "school_admin")
        .single();

      if (!userRoles?.school_id) {
        throw new Error("École non trouvée");
      }

      const equipmentArray = formData.equipment
        ? formData.equipment.split(",").map(item => item.trim()).filter(Boolean)
        : [];

      const roomData = {
        school_id: userRoles.school_id,
        name: formData.name,
        code: formData.code,
        room_type: formData.room_type || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        floor: formData.floor || null,
        building: formData.building || null,
        equipment: equipmentArray.length > 0 ? equipmentArray : null,
        is_available: formData.is_available,
        description: formData.description || null,
      };

      if (editingRoom) {
        const { error } = await supabase
          .from("rooms")
          .update(roomData)
          .eq("id", editingRoom.id);

        if (error) throw error;
        toast({ title: "Salle modifiée avec succès" });
      } else {
        const { error } = await supabase
          .from("rooms")
          .insert(roomData);

        if (error) throw error;
        toast({ title: "Salle créée avec succès" });
      }

      setDialogOpen(false);
      setEditingRoom(null);
      setFormData({
        name: "",
        code: "",
        room_type: "",
        capacity: "",
        floor: "",
        building: "",
        equipment: "",
        is_available: true,
        description: "",
      });
      fetchRooms();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      code: room.code,
      room_type: room.room_type || "",
      capacity: room.capacity?.toString() || "",
      floor: room.floor || "",
      building: room.building || "",
      equipment: room.equipment ? room.equipment.join(", ") : "",
      is_available: room.is_available,
      description: room.description || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette salle ?")) return;

    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la salle",
        variant: "destructive",
      });
    } else {
      toast({ title: "Salle supprimée avec succès" });
      fetchRooms();
    }
  };

  const canManage = userRole === "super_admin" || userRole === "school_admin";

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Gestion des Salles
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les salles de votre établissement
          </p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingRoom(null);
              setFormData({
                name: "",
                code: "",
                room_type: "",
                capacity: "",
                floor: "",
                building: "",
                equipment: "",
                is_available: true,
                description: "",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle Salle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRoom ? "Modifier la salle" : "Nouvelle salle"}
                </DialogTitle>
                <DialogDescription>
                  Remplissez les informations de la salle
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la salle *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: Salle de Sciences"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="Ex: S101"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="room_type">Type de salle</Label>
                    <Input
                      id="room_type"
                      value={formData.room_type}
                      onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                      placeholder="Ex: Labo, Classe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacité</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="Ex: 30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="floor">Étage</Label>
                    <Input
                      id="floor"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      placeholder="Ex: RDC, 1er"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="building">Bâtiment</Label>
                    <Input
                      id="building"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      placeholder="Ex: Bâtiment A"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipment">Équipements (séparés par des virgules)</Label>
                  <Input
                    id="equipment"
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    placeholder="Ex: Projecteur, Tableau blanc"
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="is_available">Disponible</Label>
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description optionnelle"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingRoom ? "Modifier" : "Créer"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune salle créée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DoorOpen className="h-5 w-5 text-primary" />
                  {room.name}
                </CardTitle>
                <CardDescription>
                  Code: {room.code}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {room.is_available ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Disponible
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Indisponible
                    </Badge>
                  )}
                  {room.room_type && (
                    <Badge variant="secondary">{room.room_type}</Badge>
                  )}
                </div>
                
                {room.capacity && (
                  <p className="text-sm">Capacité: {room.capacity} places</p>
                )}
                
                {(room.floor || room.building) && (
                  <p className="text-sm text-muted-foreground">
                    {room.building && `${room.building}`}
                    {room.building && room.floor && " - "}
                    {room.floor && `${room.floor}`}
                  </p>
                )}

                {room.equipment && room.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {room.equipment.map((eq: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                )}

                {room.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {room.description}
                  </p>
                )}

                {canManage && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(room)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(room.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
