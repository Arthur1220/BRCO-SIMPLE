const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const initialFoods = [
  // VOLUMOSOS
  { name: "Capim tanzania", category: "VOLUMOSO", MS: 234.4, MO: 892.6, EE: 23.6, PB: 95.5, PDR: 47.93, PNDR: 47.57, NDT: 490.8, FDNcp: 635.4, CNF: 138.1, Ca: 5.9, P: 1.4 },
  { name: "Silagem de milho", category: "VOLUMOSO", MS: 311.7, MO: 943.6, EE: 28.6, PB: 71.8, PDR: 50.6, PNDR: 21.2, NDT: 632.2, FDNcp: 509.3, CNF: 333.9, Ca: 2.8, P: 1.9 },
  { name: "Feno de Tifton", category: "VOLUMOSO", MS: 895.2, MO: 918.0, EE: 18.0, PB: 141.4, PDR: 98.1, PNDR: 43.3, NDT: 580.0, FDNcp: 742.2, CNF: 80.7, Ca: 3.0, P: 2.0 },

  // CONCENTRADOS ENERGÉTICOS
  { name: "Milho fubá", category: "CONCENTRADO", MS: 879.6, MO: 982.7, EE: 39.1, PB: 92.3, PDR: 38.5, PNDR: 53.8, NDT: 844.2, FDNcp: 91.7, CNF: 759.6, Ca: 0.4, P: 2.9 },
  { name: "Farelo trigo", category: "CONCENTRADO", MS: 876.4, MO: 940.6, EE: 38.1, PB: 174.5, PDR: 129.1, PNDR: 45.4, NDT: 700.5, FDNcp: 383.4, CNF: 344.6, Ca: 1.7, P: 10.4 },

  // CONCENTRADOS PROTEICOS
  { name: "Farelo de soja", category: "CONCENTRADO", MS: 886.4, MO: 933.9, EE: 19.4, PB: 487.9, PDR: 326.0, PNDR: 161.9, NDT: 811.6, FDNcp: 131.8, CNF: 294.8, Ca: 3.4, P: 5.9 },
  { name: "Farelo Gluten 21", category: "CONCENTRADO", MS: 888.4, MO: 926.8, EE: 28.3, PB: 239.1, PDR: 206.0, PNDR: 33.1, NDT: 727.2, FDNcp: 357.0, CNF: 302.4, Ca: 1.6, P: 7.0 },

  // SUPLEMENTOS (LIMITADOS)
  { name: "Bicarbonato sódio", category: "SUPLEMENTO", defaultMax: 1.0, MS: 990.0, MO: 0, EE: 0, PB: 0, PDR: 0, PNDR: 0, NDT: 0, FDNcp: 0, CNF: 0, Ca: 0, P: 0 },
  { name: "Ureia", category: "SUPLEMENTO", defaultMax: 1.0, MS: 978.8, MO: 0, EE: 0, PB: 2819.2, PDR: 2786.3, PNDR: 0, NDT: 0, FDNcp: 0, CNF: 0.8, Ca: 0.2, P: 0.8 },
  { name: "Calcáreo", category: "SUPLEMENTO", defaultMax: 1.5, MS: 992.2, MO: 0, EE: 0, PB: 0, PDR: 0, PNDR: 0, NDT: 0, FDNcp: 0, CNF: 0, Ca: 370.2, P: 0.2 },
  { name: "Supra Sal", category: "SUPLEMENTO", defaultMax: 1.5, MS: 990.0, MO: 0, EE: 0, PB: 0, PDR: 0, PNDR: 0, NDT: 0, FDNcp: 0, CNF: 0, Ca: 145.0, P: 85.0 },
];

async function main() {
  console.log('Iniciando seed de foods...');

  for (const food of initialFoods) {
    const exists = await prisma.food.findFirst({
      where: { name: food.name }
    });

    if (!exists) {
      await prisma.food.create({ data: food });
      console.log(`Food created: ${food.name}`);
    } else {
        // Opcional: Atualizar se já existe para garantir categorias corretas
        // await prisma.food.update({ where: { id: exists.id }, data: food });
        console.log(`Food already exists: ${food.name}`);
    }
  }
  console.log('Seed finalizado.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });