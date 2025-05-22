"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { insertAllFrenchRegions } from "@/hooks/use-region";

export function InsertRegionsButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean|null>(null);
  const [error, setError] = useState<string|null>(null);

  const handleInsert = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const result = await insertAllFrenchRegions();
      if (result.success) {
        setSuccess(true);
      } else {
        setSuccess(false);
        setError((result.error as any)?.message || "Erreur inconnue");
      }
    } catch (e:any) {
      setSuccess(false);
      setError(e.message || "Erreur lors de l'insertion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 flex flex-col items-center">
      <Button onClick={handleInsert} disabled={loading} variant="outline">
        {loading ? "Insertion en cours..." : "Insérer les régions françaises"}
      </Button>
      {success === true && (
        <span className="text-green-600 text-xs mt-2">Régions insérées avec succès !</span>
      )}
      {success === false && error && (
        <span className="text-red-600 text-xs mt-2">Erreur : {error}</span>
      )}
    </div>
  );
}
