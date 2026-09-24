const fs = require("fs");

function getERPNextConfig() {
  if (
    process.env.ERPNEXT_URL &&
    process.env.ERPNEXT_API_KEY &&
    process.env.ERPNEXT_API_SECRET
  ) {
    return {
      url: process.env.ERPNEXT_URL,
      apiKey: process.env.ERPNEXT_API_KEY,
      apiSecret: process.env.ERPNEXT_API_SECRET,
    };
  }

  const lines = fs
    .readFileSync("erpnext-api-new.txt", "utf8")
    .split(/\r?\n/)
    .filter(Boolean);

  const getValue = (prefix) => {
    const line = lines.find((x) => x.startsWith(prefix));

    if (!line) {
      throw new Error(`${prefix} not found in erpnext-api-new.txt`);
    }

    return line.slice(prefix.length).trim();
  };

  return {
    url: getValue("ERPNext URL:"),
    apiKey: getValue("API Key:"),
    apiSecret: getValue("API Secret:"),
  };
}

async function erpnextRequest(path, options = {}) {
  const { url, apiKey, apiSecret } = getERPNextConfig();

  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${apiKey}:${apiSecret}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `ERPNext API error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function getERPNextItems() {
  return erpnextRequest(
    '/api/resource/Item?fields=["item_code","item_name","item_group"]&limit_page_length=100'
  );
}

async function createERPNextSalesOrder(order) {
  const itemCodeMap = {
    "Wireless Headphones": "SKART-WH-001",
    "Smart Watch": "Smart Watch",
    "Men's Casual Shirt": "Men's Casual Shirt",
    "Women's Handbag": "Women's Handbag",
    "Home Decor Lamp": "Home Decor Lamp",
    "Face Care Kit": "Face Care Kit",
    "Running Shoes": "Running Shoes",
    "Premium Grocery Pack": "Premium Grocery Pack",
  };

  const items = [];

  for (const orderItem of order.items) {
    const productName = orderItem.product.name;

    const itemCode = itemCodeMap[productName];

    if (!itemCode) {
      throw new Error(
        `No ERPNext item mapping found for SKART product: ${productName}`
      );
    }

    // Verify that the exact ERPNext item exists.
    await erpnextRequest(
      `/api/resource/Item/${encodeURIComponent(itemCode)}`
    );

    items.push({
      item_code: itemCode,
      qty: orderItem.quantity,
      rate: orderItem.price,
      warehouse: "SKART Main Warehouse - S",
    });
  }
const transactionDate = new Date().toISOString().slice(0, 10);

const deliveryDate = new Date();
deliveryDate.setDate(deliveryDate.getDate() + 2);

const deliveryDateString = deliveryDate.toISOString().slice(0, 10);

  const payload = {
  customer: "SKART Online Customer",
  company: "SKART",
  transaction_date: transactionDate,
  delivery_date: deliveryDateString,
  items,
};
console.log("ERPNext Sales Order payload:", JSON.stringify(payload, null, 2));

  const response = await erpnextRequest("/api/resource/Sales Order", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.message || response.data;
}

module.exports = {
  erpnextRequest,
  getERPNextItems,
  createERPNextSalesOrder,
};