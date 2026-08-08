import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';

// Setup Supabase (Ambil dari .env kamu)
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); 
// Note: Gunakan SERVICE_ROLE_KEY untuk migrasi backend agar bypass RLS

// Ganti dengan User ID Supabase kamu yang terdaftar di auth.users
const USER_ID = '3b8e9fa3-ce65-40a7-8701-6b6a16208325'; 

async function migrateData() {
  console.log('Membaca file Excel...');
  const workbook = xlsx.readFile('Money Manager_8-8-26.xlsx');
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  // 1. Ekstrak Data Unik
  const accountNames = new Set(rawData.map(row => row['Account']).filter(Boolean));
  const uniqueCategoriesMap = new Map();
  
  rawData.forEach(row => {
    if (row['Category'] && row['Income/Expense']) {
      let rawType = row['Income/Expense'].toLowerCase();
      // Untuk transfer-out, Category sebenarnya adalah nama akun tujuan
      if (rawType === 'transfer-out' || rawType === 'transfer-in') {
        accountNames.add(row['Category']);
      } else {
        uniqueCategoriesMap.set(row['Category'], rawType);
      }
    }
  });

  const uniqueAccounts = [...accountNames];

  // 1.5 Reset Data Lama
  console.log('Mereset data sebelumnya di database...');
  
  // Hapus transaksi terlebih dahulu (karena memiliki relasi ke categories dan accounts)
  const { error: errDelTx } = await supabase.from('transactions').delete().eq('user_id', USER_ID);
  if (errDelTx) throw errDelTx;

  // Hapus kategori
  const { error: errDelCat } = await supabase.from('categories').delete().eq('user_id', USER_ID);
  if (errDelCat) throw errDelCat;

  // Hapus dompet/accounts
  const { error: errDelAcc } = await supabase.from('accounts').delete().eq('user_id', USER_ID);
  if (errDelAcc) throw errDelAcc;
  
  console.log('Data lama berhasil dihapus.');

  // 2. Insert Accounts
  console.log(`Menginsert ${uniqueAccounts.length} Accounts...`);
  const accountsToInsert = uniqueAccounts.map(name => ({ user_id: USER_ID, name }));
  const { data: accountsData, error: errAcc } = await supabase.from('accounts').insert(accountsToInsert).select();
  if (errAcc) throw errAcc;

  // Buat dictionary Account Name -> Account ID untuk transaksi nanti
  const accountIdMap = {};
  accountsData.forEach(acc => { accountIdMap[acc.name] = acc.id; });

  // 3. Insert Categories
  console.log(`Menginsert ${uniqueCategoriesMap.size} Categories...`);
  const categoriesToInsert = Array.from(uniqueCategoriesMap, ([name, type]) => ({ user_id: USER_ID, name, type }));
  const { data: categoriesData, error: errCat } = await supabase.from('categories').insert(categoriesToInsert).select();
  if (errCat) throw errCat;

  // Buat dictionary Category Name -> Category ID
  const categoryIdMap = {};
  categoriesData.forEach(cat => { categoryIdMap[cat.name] = cat.id; });

  // 4. Transform & Insert Transactions
  console.log(`Menyiapkan Transaksi...`);
  const transactionsToInsert = [];
  
  rawData.forEach(row => {
    // Convert Excel serial date ke YYYY-MM-DD
    let transaction_date = new Date(Math.round((row['Date'] - 25569) * 86400 * 1000)).toISOString(); 
    
    let rawType = row['Income/Expense'].toLowerCase();
    let note = row['Note'] || null;

    if (rawType === 'transfer-out') {
      let targetAccount = row['Category'] || 'Dompet Lain';
      
      // 1. Transaksi Keluar (Expense) dari source account
      transactionsToInsert.push({
        user_id: USER_ID,
        amount: row['Amount'],
        type: 'expense',
        note: note ? `Transfer ke ${targetAccount} - ${note}` : `Transfer ke ${targetAccount}`,
        transaction_date: transaction_date,
        account_id: accountIdMap[row['Account']],
        category_id: null,
      });

      // 2. Transaksi Masuk (Income) ke target account
      transactionsToInsert.push({
        user_id: USER_ID,
        amount: row['Amount'],
        type: 'income',
        note: note ? `Transfer dari ${row['Account']} - ${note}` : `Transfer dari ${row['Account']}`,
        transaction_date: transaction_date,
        account_id: accountIdMap[targetAccount],
        category_id: null,
      });
      
    } else if (rawType === 'transfer-in') {
      let sourceAccount = row['Category'] || 'Dompet Lain';
      // Jaga-jaga jika ada transfer-in secara independen
      transactionsToInsert.push({
        user_id: USER_ID,
        amount: row['Amount'],
        type: 'income',
        note: note ? `Transfer dari ${sourceAccount} - ${note}` : `Transfer dari ${sourceAccount}`,
        transaction_date: transaction_date,
        account_id: accountIdMap[row['Account']],
        category_id: null,
      });
    } else {
      // Income / Expense biasa
      transactionsToInsert.push({
        user_id: USER_ID,
        amount: row['Amount'],
        type: rawType,
        note: note,
        transaction_date: transaction_date,
        account_id: accountIdMap[row['Account']],
        category_id: categoryIdMap[row['Category']] || null,
      });
    }
  });

  // Supabase membatasi jumlah insert dalam 1 request (biasanya max 1000). 
  // Jika data sangat besar (ribuan), gunakan cara batching:
  const BATCH_SIZE = 500;
  for (let i = 0; i < transactionsToInsert.length; i += BATCH_SIZE) {
    const batch = transactionsToInsert.slice(i, i + BATCH_SIZE);
    console.log(`Menginsert Transaksi baris ${i + 1} s.d ${i + batch.length}...`);
    const { error: errTx } = await supabase.from('transactions').insert(batch);
    if (errTx) throw errTx;
  }

  console.log('✅ Migrasi Data Berhasil!');
}

migrateData().catch(console.error);