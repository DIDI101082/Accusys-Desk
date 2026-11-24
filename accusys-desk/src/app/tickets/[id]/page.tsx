import { AppShell } from "@/components/layout/AppShell";
import { TicketDetail } from "@/components/tickets/TicketDetail";

export default function TicketPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <TicketDetail ticketId={params.id} />
    </AppShell>
  );
}
