import { createClient } from "@/lib/supabase/server";
import { ClientCard } from "@/components/clients/ClientCard";
import { Topbar } from "@/components/layout/Topbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Client } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle="Visão geral dos clientes"
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
        {clients && clients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(clients as Client[]).map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-4">Nenhum cliente cadastrado ainda.</p>
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
