import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
console.error("DATABASE_URL is not available.");
console.error("Please check your .env file.");
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
const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
console.log("saiofficial0623@gmail.com.");
console.log("Example: npm run make-admin [saiofficial0623@gmail.com](mailto:saiofficial0623@gmail.com.com)");
return;
}

console.log("Connecting to database...");

const user = await prisma.user.findUnique({
where: {
email,
},
});

if (!user) {
console.log(`User not found: ${email}`);
return;
}

const updatedUser = await prisma.user.update({
where: {
id: user.id,
},
data: {
role: "ADMIN",
},
});

console.log("");
console.log("=================================");
console.log("ADMIN ACCOUNT CREATED");
console.log("=================================");
console.log(`Name  : ${updatedUser.name}`);
console.log(`Email : ${updatedUser.email}`);
console.log(`Role  : ${updatedUser.role}`);
console.log("=================================");
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
