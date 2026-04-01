import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { ClientCard } from "@/components/clients/ClientCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Client } from "@/types/database";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  return (
    <div>
      <Topbar
        title="Clientes"
        subtitle={`${clients?.length ?? 0} clientes cadastrados`}
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
          {(clients as Client[] ?? []).map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
        {(!clients || clients.length === 0) && (
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
