"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  User,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Loader2,
  Database,
  UserPlus,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";

interface DatabasePerson {
  id: string;
  person_name: string;
  image_path: string;
  image_base64?: string;
  name?: string;
  age?: number;
  email?: string;
  phone?: string;
  notes?: string;
  added_by?: {
    name: string;
    email: string;
  };
  added_at?: string;
  model_name?: string;
  detector_backend?: string;
}

export default function FaceDatabase() {
  const [persons, setPersons] = useState<DatabasePerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    person_name: "",
    name: "",
    age: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    loadDatabase();
  }, []);

  const loadDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/face/database/list");
      const data = await response.json();
      if (data.success) {
        setPersons(data.persons || []);
      }
    } catch (error) {
      console.error("Error loading database:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAddPerson = async () => {
    if (!selectedFile) {
      alert("Please select an image first");
      return;
    }

    if (!formData.person_name.trim()) {
      alert("Please enter a person name/identifier");
      return;
    }

    setIsAdding(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const formDataToSend = new FormData();
      formDataToSend.append("image", selectedFile);
      formDataToSend.append("person_name", formData.person_name);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("age", formData.age);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("notes", formData.notes);
      if (user) {
        formDataToSend.append("added_by_name", user.name);
        formDataToSend.append("added_by_email", user.email);
      }

      console.log("Sending form data:", {
        hasFile: !!selectedFile,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        fileType: selectedFile?.type,
        personName: formData.person_name
      });

      const response = await fetch("/api/face/database/add", {
        method: "POST",
        body: formDataToSend,
        // Don't set Content-Type header - browser will set it with boundary
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error || data.message || "Failed to add person to database";
        console.error("Add person error:", data);
        throw new Error(errorMsg);
      }

      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setFormData({
        person_name: "",
        name: "",
        age: "",
        email: "",
        phone: "",
        notes: "",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reload database
      await loadDatabase();
      alert("Person added to database successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add person to database";
      console.error("Error adding person:", err);
      alert(`Error: ${errorMessage}\n\nPlease check:\n1. Backend service is running\n2. MongoDB connection is working\n3. Image file is valid`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePerson = async (id: string, personName: string) => {
    if (!confirm(`Are you sure you want to delete ${personName} from the database?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/face/database/delete/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete person");
      }

      await loadDatabase();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      alert(errorMessage);
    }
  };

  const handleEdit = (person: DatabasePerson) => {
    setEditingId(person.id);
    setFormData({
      person_name: person.person_name,
      name: person.name || "",
      age: person.age?.toString() || "",
      email: person.email || "",
      phone: person.phone || "",
      notes: person.notes || "",
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/face/database/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update person");
      }

      setEditingId(null);
      await loadDatabase();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      alert(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      person_name: "",
      name: "",
      age: "",
      email: "",
      phone: "",
      notes: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Add New Person Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Person to Database
          </CardTitle>
          <CardDescription>
            Upload an image and add person details to the face recognition database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Click to upload person's photo
                </p>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Person ID/Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.person_name}
                onChange={(e) =>
                  setFormData({ ...formData, person_name: e.target.value })
                }
                placeholder="e.g., john_doe"
                className="w-full p-2 border rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., John Doe"
                className="w-full p-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                placeholder="e.g., 25"
                className="w-full p-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="e.g., john@example.com"
                className="w-full p-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="e.g., +1234567890"
                className="w-full p-2 border rounded-md bg-background"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes about this person..."
                rows={3}
                className="w-full p-2 border rounded-md bg-background"
              />
            </div>
          </div>

          <Button
            onClick={handleAddPerson}
            disabled={isAdding || !selectedFile || !formData.person_name.trim()}
            className="w-full"
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding to Database...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add to Database
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Database List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database ({persons.length} persons)
          </CardTitle>
          <CardDescription>
            Manage persons in the face recognition database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : persons.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No persons in database. Add one above to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {persons.map((person) => (
                <Card key={person.id} className="overflow-hidden">
                  <div className="relative">
                    {person.image_base64 ? (
                      <img
                        src={person.image_base64}
                        alt={person.person_name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    {editingId === person.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={formData.person_name}
                          onChange={(e) =>
                            setFormData({ ...formData, person_name: e.target.value })
                          }
                          className="w-full p-2 border rounded-md bg-background text-sm"
                          placeholder="Person ID"
                        />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full p-2 border rounded-md bg-background text-sm"
                          placeholder="Full Name"
                        />
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) =>
                            setFormData({ ...formData, age: e.target.value })
                          }
                          className="w-full p-2 border rounded-md bg-background text-sm"
                          placeholder="Age"
                        />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full p-2 border rounded-md bg-background text-sm"
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full p-2 border rounded-md bg-background text-sm"
                          placeholder="Phone"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(person.id)}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{person.person_name}</p>
                            {person.name && (
                              <p className="text-sm text-muted-foreground">
                                {person.name}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(person)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePerson(person.id, person.person_name)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          {person.age && (
                            <p className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              Age: {person.age}
                            </p>
                          )}
                          {person.email && (
                            <p className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {person.email}
                            </p>
                          )}
                          {person.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {person.phone}
                            </p>
                          )}
                          {person.notes && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {person.notes}
                            </p>
                          )}
                          {person.added_by && (
                            <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                              Added by: {person.added_by.name}
                              {person.added_at && (
                                <span className="block">
                                  {new Date(person.added_at).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



