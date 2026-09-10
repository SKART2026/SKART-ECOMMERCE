import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
console.error("DATABASE_URL is not available.");
process.exit(1);
}

const pool = new Pool({
connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
adapter,
});

async function main() {
const users = await prisma.user.findMany({
select: {
id: true,
name: true,
email: true,
role: true,
},
orderBy: {
id: "asc",
},
});

console.log("");
console.log("========== SHOPKART USERS ==========");

if (users.length === 0) {
console.log("No users found.");
} else {
users.forEach((user) => {
console.log(
`ID: ${user.id} | Name: ${user.name} | Email: ${user.email} | Role: ${user.role}`
);
});
}

console.log("====================================");
}

main()
.catch((error) => {
console.error("ERROR:", error);
process.exit(1);
})
.finally(async () => {
await prisma.$disconnect();
await pool.end();
});
