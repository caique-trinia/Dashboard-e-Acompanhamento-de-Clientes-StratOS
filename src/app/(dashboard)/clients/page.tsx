"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { ClientCard } from "@/components/clients/ClientCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@/types/database";

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setClients(data); });
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Cliente excluído." });
    } else {
      toast({ title: "Erro ao excluir cliente", variant: "destructive" });
    }
  }

  return (
    <div>
      <Topbar
        title="Clientes"
        subtitle={`${clients.length} clientes cadastrados`}
        actions={
          <Link href="/clients/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} onDelete={handleDelete} />
          ))}
        </div>
        {clients.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-4">Nenhum cliente cadastrado.</p>
            <Link href="/clients/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar primeiro cliente
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
