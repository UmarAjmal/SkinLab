import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking for existing sales to backfill payments...");
  const sales = await prisma.sale.findMany({
    where: { paid_amount: { gt: 0 } },
    include: { payments: true },
  });

  let backfilledCount = 0;
  for (const sale of sales) {
    if (sale.payments.length === 0) {
      await prisma.payment.create({
        data: {
          sale_id: sale.id,
          customer_id: sale.customer_id,
          amount: sale.paid_amount,
          payment_method: sale.payment_method || "Cash",
          payment_date: sale.date,
          notes: "Initial payment backfill from existing invoice",
        },
      });
      backfilledCount++;
    }
  }

  console.log(`Successfully backfilled ${backfilledCount} payment records.`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
