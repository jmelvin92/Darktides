#!/usr/bin/env node
import { createInterface } from 'readline';
import { supabase } from '../lib/supabase/client.js';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function addProduct() {
  console.log('\n=== Add New Product ===\n');
  
  const id = await question('Product ID (e.g., bpc157-10): ');
  const name = await question('Product Name (e.g., BPC-157 10mg): ');
  const shortName = await question('Short Name (e.g., BPC-157): ');
  const dosage = await question('Dosage (e.g., 10 MG): ');
  const price = parseFloat(await question('Price (e.g., 40.00): '));
  const oldPrice = parseFloat(await question('Old Price (e.g., 60.00): '));
  const sku = await question('SKU (e.g., DT-BPC-010): ');
  const description = await question('Description: ');
  const stockQuantity = parseInt(await question('Initial Stock Quantity: '));
  const displayOrder = parseInt(await question('Display Order (1-100): '));
  
  const product = {
    id,
    name,
    short_name: shortName,
    dosage,
    price,
    old_price: oldPrice,
    sku,
    description,
    stock_quantity: stockQuantity,
    display_order: displayOrder,
    is_active: true
  };
  
  const { error } = await supabase.from('products').insert(product as any);
  
  if (error) {
    console.error('\n❌ Error adding product:', error.message);
  } else {
    console.log('\n✅ Product added successfully!');
  }
}

async function updateStock() {
  console.log('\n=== Update Product Stock ===\n');
  
  const { data: products } = await supabase
    .from('products')
    .select('id, name, stock_quantity')
    .order('display_order') as any;
  
  if (!products || products.length === 0) {
    console.log('No products found.');
    return;
  }
  
  console.log('\nCurrent Products:');
  products.forEach((p: any, i: number) => {
    console.log(`${i + 1}. ${p.name} - Current Stock: ${p.stock_quantity}`);
  });
  
  const choice = parseInt(await question('\nSelect product number: ')) - 1;
  
  if (choice < 0 || choice >= products.length) {
    console.log('Invalid selection.');
    return;
  }
  
  const selected = products[choice];
  const newQuantity = parseInt(await question(`New stock quantity for ${selected.name}: `));
  
  const { error } = await supabase
    .from('products')
    .update({ stock_quantity: newQuantity } as any)
    .eq('id', selected.id);
  
  if (error) {
    console.error('\n❌ Error updating stock:', error.message);
  } else {
    console.log('\n✅ Stock updated successfully!');
  }
}

async function toggleProduct() {
  console.log('\n=== Toggle Product Active Status ===\n');
  
  const { data: products } = await supabase
    .from('products')
    .select('id, name, is_active')
    .order('display_order') as any;
  
  if (!products || products.length === 0) {
    console.log('No products found.');
    return;
  }
  
  console.log('\nCurrent Products:');
  products.forEach((p: any, i: number) => {
    console.log(`${i + 1}. ${p.name} - ${p.is_active ? '✅ Active' : '❌ Inactive'}`);
  });
  
  const choice = parseInt(await question('\nSelect product number to toggle: ')) - 1;
  
  if (choice < 0 || choice >= products.length) {
    console.log('Invalid selection.');
    return;
  }
  
  const selected = products[choice];
  
  const { error } = await supabase
    .from('products')
    .update({ is_active: !selected.is_active } as any)
    .eq('id', selected.id);
  
  if (error) {
    console.error('\n❌ Error toggling product:', error.message);
  } else {
    console.log(`\n✅ Product ${selected.name} is now ${!selected.is_active ? 'active' : 'inactive'}!`);
  }
}

async function viewInventory() {
  console.log('\n=== Current Inventory ===\n');
  
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('display_order') as any;
  
  if (!products || products.length === 0) {
    console.log('No products found.');
    return;
  }
  
  console.log('ID\t\tName\t\t\t\tStock\tReserved\tActive');
  console.log('-'.repeat(80));
  
  products.forEach((p: any) => {
    console.log(
      `${p.id}\t${p.name.padEnd(30)}\t${p.stock_quantity}\t${p.reserved_quantity}\t\t${p.is_active ? '✅' : '❌'}`
    );
  });
}

async function editProduct() {
  console.log('\n=== Edit Product Details ===\n');
  
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, old_price, description')
    .order('display_order') as any;
  
  if (!products || products.length === 0) {
    console.log('No products found.');
    return;
  }
  
  console.log('\nCurrent Products:');
  products.forEach((p: any, i: number) => {
    console.log(`${i + 1}. ${p.name} - $${p.price}`);
  });
  
  const choice = parseInt(await question('\nSelect product number to edit: ')) - 1;
  
  if (choice < 0 || choice >= products.length) {
    console.log('Invalid selection.');
    return;
  }
  
  const selected = products[choice];
  console.log(`\nEditing: ${selected.name}`);
  console.log('(Press Enter to keep current value)\n');
  
  const newName = await question(`Name [${selected.name}]: `) || selected.name;
  const newPrice = await question(`Price [${selected.price}]: `) || selected.price;
  const newOldPrice = await question(`Old Price [${selected.old_price || 'none'}]: `) || selected.old_price;
  const newDescription = await question(`Description [current]: `) || selected.description;
  
  const updates = {
    name: newName,
    price: parseFloat(newPrice),
    old_price: newOldPrice ? parseFloat(newOldPrice) : null,
    description: newDescription
  };
  
  const { error } = await (supabase
    .from('products') as any)
    .update(updates)
    .eq('id', selected.id);
  
  if (error) {
    console.error('\n❌ Error updating product:', error.message);
  } else {
    console.log('\n✅ Product updated successfully!');
  }
}

async function deleteProduct() {
  console.log('\n=== Delete Product (Permanent) ===\n');
  console.log('⚠️  WARNING: This will permanently delete the product and all its transaction history!');
  console.log('💡 Tip: Consider using "Toggle Active Status" to hide products instead.\n');
  
  const { data: products } = await supabase
    .from('products')
    .select('id, name, stock_quantity')
    .order('display_order') as any;
  
  if (!products || products.length === 0) {
    console.log('No products found.');
    return;
  }
  
  console.log('Current Products:');
  products.forEach((p: any, i: number) => {
    console.log(`${i + 1}. ${p.name} - Stock: ${p.stock_quantity}`);
  });
  
  const choice = parseInt(await question('\nSelect product number to DELETE: ')) - 1;
  
  if (choice < 0 || choice >= products.length) {
    console.log('Invalid selection.');
    return;
  }
  
  const selected = products[choice];
  const confirm = await question(`\n⚠️  Type "DELETE" to confirm removal of "${selected.name}": `);
  
  if (confirm !== 'DELETE') {
    console.log('\n❌ Deletion cancelled.');
    return;
  }
  
  const { error } = await (supabase
    .from('products') as any)
    .delete()
    .eq('id', selected.id);
  
  if (error) {
    console.error('\n❌ Error deleting product:', error.message);
  } else {
    console.log(`\n✅ Product "${selected.name}" deleted permanently.`);
  }
}

async function main() {
  console.log('\n🧪 DarkTides Research - Product Manager\n');
  
  while (true) {
    console.log('\n=== Main Menu ===');
    console.log('1. Add New Product');
    console.log('2. Update Stock Quantity');
    console.log('3. Edit Product Details (name, price, description)');
    console.log('4. Toggle Product Active Status (hide/show)');
    console.log('5. View Inventory');
    console.log('6. Delete Product (Permanent)');
    console.log('7. Exit');
    
    const choice = await question('\nSelect an option (1-7): ');
    
    switch (choice) {
      case '1':
        await addProduct();
        break;
      case '2':
        await updateStock();
        break;
      case '3':
        await editProduct();
        break;
      case '4':
        await toggleProduct();
        break;
      case '5':
        await viewInventory();
        break;
      case '6':
        await deleteProduct();
        break;
      case '7':
        console.log('\nGoodbye!');
        rl.close();
        process.exit(0);
      default:
        console.log('\nInvalid option. Please try again.');
    }
  }
}

main().catch(console.error);