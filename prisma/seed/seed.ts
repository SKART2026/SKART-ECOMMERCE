import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});async function main() {
  console.log("Adding ShopKart categories...");

  const categories = [
    "Electronics",
    "Fashion",
    "Home & Living",
    "Beauty",
    "Sports",
    "Groceries",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Adding ShopKart products...");

  const products = [
    {
      name: "Wireless Headphones",
      category: "Electronics",
      price: 1499,
      oldPrice: 2499,
      rating: 4.5,
      reviews: 128,
      stock: 50,
      image: "🎧",
    },
    {
      name: "Smart Watch",
      category: "Electronics",
      price: 1999,
      oldPrice: 3499,
      rating: 4.4,
      reviews: 96,
      stock: 40,
      image: "⌚",
    },
    {
      name: "Men's Casual Shirt",
      category: "Fashion",
      price: 799,
      oldPrice: 1299,
      rating: 4.3,
      reviews: 74,
      stock: 60,
      image: "👕",
    },
    {
      name: "Women's Handbag",
      category: "Fashion",
      price: 1199,
      oldPrice: 1999,
      rating: 4.6,
      reviews: 112,
      stock: 35,
      image: "👜",
    },
    {
      name: "Home Decor Lamp",
      category: "Home & Living",
      price: 899,
      oldPrice: 1499,
      rating: 4.2,
      reviews: 63,
      stock: 30,
      image: "💡",
    },
    {
      name: "Face Care Kit",
      category: "Beauty",
      price: 699,
      oldPrice: 999,
      rating: 4.5,
      reviews: 89,
      stock: 45,
      image: "🧴",
    },
    {
      name: "Running Shoes",
      category: "Sports",
      price: 1799,
      oldPrice: 2999,
      rating: 4.7,
      reviews: 145,
      stock: 55,
      image: "👟",
    },
    {
      name: "Premium Grocery Pack",
      category: "Groceries",
      price: 599,
      oldPrice: 799,
      rating: 4.4,
      reviews: 51,
      stock: 100,
      image: "🛒",
    },
  ];

  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { name: product.category },
    });

    if (!category) {
      throw new Error(`Category not found: ${product.category}`);
    }

    await prisma.product.create({
      data: {
        name: product.name,
        price: product.price,
        oldPrice: product.oldPrice,
        rating: product.rating,
        reviews: product.reviews,
        stock: product.stock,
        image: product.image,
        categoryId: category.id,
        description: `High-quality ${product.name} available at ShopKart.`,
      },
    });
  }

  console.log("ShopKart products added successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });