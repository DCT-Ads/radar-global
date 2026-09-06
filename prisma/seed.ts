import { PlanSlug, PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { DEFAULT_CRTSH_CONFIG } from "../lib/collectors/config";

const prisma = new PrismaClient();

const COUNTRIES = [
  { iso2: "US", iso3: "USA", name: "United States", namePt: "Estados Unidos", nameEs: "Estados Unidos", currency: "USD" },
  { iso2: "GB", iso3: "GBR", name: "United Kingdom", namePt: "Reino Unido", nameEs: "Reino Unido", currency: "GBP" },
  { iso2: "CA", iso3: "CAN", name: "Canada", namePt: "Canadá", nameEs: "Canadá", currency: "CAD" },
  { iso2: "AU", iso3: "AUS", name: "Australia", namePt: "Austrália", nameEs: "Australia", currency: "AUD" },
  { iso2: "DE", iso3: "DEU", name: "Germany", namePt: "Alemanha", nameEs: "Alemania", currency: "EUR" },
  { iso2: "FR", iso3: "FRA", name: "France", namePt: "França", nameEs: "Francia", currency: "EUR" },
  { iso2: "ES", iso3: "ESP", name: "Spain", namePt: "Espanha", nameEs: "España", currency: "EUR" },
  { iso2: "IT", iso3: "ITA", name: "Italy", namePt: "Itália", nameEs: "Italia", currency: "EUR" },
  { iso2: "NL", iso3: "NLD", name: "Netherlands", namePt: "Países Baixos", nameEs: "Países Bajos", currency: "EUR" },
  { iso2: "PT", iso3: "PRT", name: "Portugal", namePt: "Portugal", nameEs: "Portugal", currency: "EUR" },
  { iso2: "BR", iso3: "BRA", name: "Brazil", namePt: "Brasil", nameEs: "Brasil", currency: "BRL" },
  { iso2: "MX", iso3: "MEX", name: "Mexico", namePt: "México", nameEs: "México", currency: "MXN" },
  { iso2: "AR", iso3: "ARG", name: "Argentina", namePt: "Argentina", nameEs: "Argentina", currency: "ARS" },
  { iso2: "CO", iso3: "COL", name: "Colombia", namePt: "Colômbia", nameEs: "Colombia", currency: "COP" },
  { iso2: "CL", iso3: "CHL", name: "Chile", namePt: "Chile", nameEs: "Chile", currency: "CLP" },
  { iso2: "JP", iso3: "JPN", name: "Japan", namePt: "Japão", nameEs: "Japón", currency: "JPY" },
  { iso2: "IN", iso3: "IND", name: "India", namePt: "Índia", nameEs: "India", currency: "INR" },
  { iso2: "NZ", iso3: "NZL", name: "New Zealand", namePt: "Nova Zelândia", nameEs: "Nueva Zelanda", currency: "NZD" },
  { iso2: "IE", iso3: "IRL", name: "Ireland", namePt: "Irlanda", nameEs: "Irlanda", currency: "EUR" },
  { iso2: "SG", iso3: "SGP", name: "Singapore", namePt: "Singapura", nameEs: "Singapur", currency: "SGD" },
] as const;

const PLANS = [
  {
    slug: PlanSlug.FREE,
    name: "Free",
    priceCents: 0,
    dailyOpportunityLimit: 3,
    countryLimit: 1,
    historyDays: 0,
    unlockCommission: false,
    alertsEnabled: false,
    alertsUnlimited: false,
    earlySignalEnabled: false,
  },
  {
    slug: PlanSlug.PRO,
    name: "Pro",
    priceCents: 4700,
    dailyOpportunityLimit: -1,
    countryLimit: 3,
    historyDays: 30,
    unlockCommission: true,
    alertsEnabled: true,
    alertsUnlimited: false,
    earlySignalEnabled: false,
  },
  {
    slug: PlanSlug.PREMIUM,
    name: "Premium",
    priceCents: 9700,
    dailyOpportunityLimit: -1,
    countryLimit: -1,
    historyDays: -1,
    unlockCommission: true,
    alertsEnabled: true,
    alertsUnlimited: true,
    earlySignalEnabled: true,
  },
] as const;

async function seedCountries() {
  for (const country of COUNTRIES) {
    await prisma.country.upsert({
      where: { iso2: country.iso2 },
      update: {
        iso3: country.iso3,
        name: country.name,
        namePt: country.namePt,
        nameEs: country.nameEs,
        currency: country.currency,
        isActive: true,
      },
      create: country,
    });
  }

  console.log(`Seeded ${COUNTRIES.length} countries`);
}

async function seedPlans() {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        priceCents: plan.priceCents,
        dailyOpportunityLimit: plan.dailyOpportunityLimit,
        countryLimit: plan.countryLimit,
        historyDays: plan.historyDays,
        unlockCommission: plan.unlockCommission,
        alertsEnabled: plan.alertsEnabled,
        alertsUnlimited: plan.alertsUnlimited,
        earlySignalEnabled: plan.earlySignalEnabled,
      },
      create: plan,
    });
  }

  console.log(`Seeded ${PLANS.length} plans`);
}

async function seedSources() {
  await prisma.source.upsert({
    where: { slug: "crtsh" },
    update: {
      name: "crt.sh Certificate Transparency",
      reliability: 95,
    },
    create: {
      slug: "crtsh",
      name: "crt.sh Certificate Transparency",
      reliability: 95,
      config: DEFAULT_CRTSH_CONFIG,
    },
  });

  await prisma.source.upsert({
    where: { slug: "http_probe" },
    update: {
      name: "HTTP availability probe",
      reliability: 90,
    },
    create: {
      slug: "http_probe",
      name: "HTTP availability probe",
      reliability: 90,
    },
  });

  console.log("Seeded 2 sources");
}

function adminSeedCredentials() {
  const fromEnvEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const fromEnvPassword = process.env.ADMIN_PASSWORD;
  const isProd = process.env.NODE_ENV === "production";

  if (fromEnvEmail && fromEnvPassword) {
    return { email: fromEnvEmail, password: fromEnvPassword };
  }

  if (isProd) {
    return null;
  }

  return {
    email: fromEnvEmail || "admin@radar.local",
    password: fromEnvPassword || "ChangeMeAdmin123!",
  };
}

async function seedAdmin() {
  const credentials = adminSeedCredentials();
  if (!credentials) {
    console.log("Skipping admin seed: set ADMIN_EMAIL and ADMIN_PASSWORD in production");
    return;
  }

  const freePlan = await prisma.plan.findUnique({ where: { slug: PlanSlug.FREE } });
  if (!freePlan) {
    throw new Error("FREE plan is missing; seed plans before admin");
  }

  const passwordHash = await hashPassword(credentials.password);
  const user = await prisma.user.upsert({
    where: { email: credentials.email },
    update: {
      role: "ADMIN",
      passwordHash,
      name: "Admin",
    },
    create: {
      email: credentials.email,
      passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: { planId: freePlan.id, status: "ACTIVE" },
    create: {
      userId: user.id,
      planId: freePlan.id,
      status: "ACTIVE",
    },
  });

  console.log(`Seeded admin ${credentials.email}`);
}

const DEV_TEST_EMAIL = "teste@dev.com";
const DEV_TEST_PASSWORD = "senha123";

async function seedDevUser() {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const freePlan = await prisma.plan.findUnique({ where: { slug: PlanSlug.FREE } });
  if (!freePlan) {
    throw new Error("FREE plan is missing; seed plans before dev user");
  }

  const passwordHash = await hashPassword(DEV_TEST_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: DEV_TEST_EMAIL },
    update: {
      passwordHash,
      name: "Teste Dev",
      role: "USER",
    },
    create: {
      email: DEV_TEST_EMAIL,
      passwordHash,
      name: "Teste Dev",
      role: "USER",
    },
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: { planId: freePlan.id, status: "ACTIVE" },
    create: {
      userId: user.id,
      planId: freePlan.id,
      status: "ACTIVE",
    },
  });

  console.log(`Seeded dev user ${DEV_TEST_EMAIL}`);
}

async function main() {
  await seedCountries();
  await seedPlans();
  await seedSources();
  await seedAdmin();
  await seedDevUser();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
