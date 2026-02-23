const createSchemaMeta = (fields = {}) => ({
  path: (fieldName) => {
    const instance = fields[fieldName];
    if (!instance) {
      return undefined;
    }
    return { instance };
  }
});

const createModel = (modelName, tableName, schemaFields = {}) => ({
  modelName,
  tableName,
  schema: createSchemaMeta(schemaFields)
});

module.exports = {
  MenuItem: createModel('MenuItem', 'menu_items'),
  Category: createModel('Category', 'categories'),
  Table: createModel('Table', 'tables'),
  TableZone: createModel('TableZone', 'table_zones'),
  Bill: createModel('Bill', 'bills', {
    table_service_charge: 'Number',
    table_usage_duration: 'String'
  }),
  BillItem: createModel('BillItem', 'bill_items'),
  InvoiceVoid: createModel('InvoiceVoid', 'invoice_voids'),
  Payment: createModel('Payment', 'payments'),
  PaymentMethod: createModel('PaymentMethod', 'payment_methods'),
  InventoryItem: createModel('InventoryItem', 'inventory_items'),
  RecipeItem: createModel('RecipeItem', 'recipe_items'),
  InventoryWaste: createModel('InventoryWaste', 'inventory_waste'),
  InventoryDeduction: createModel('InventoryDeduction', 'inventory_deductions'),
  PricingSetting: createModel('PricingSetting', 'pricing_settings'),
  DiscountRule: createModel('DiscountRule', 'discount_rules'),
  BusinessRule: createModel('BusinessRule', 'business_rules'),
  DeliveryPlatform: createModel('DeliveryPlatform', 'delivery_platforms'),
  ReceiptConfig: createModel('ReceiptConfig', 'receipt_config'),
  PrinterSetting: createModel('PrinterSetting', 'printer_settings'),
  StoreProfile: createModel('StoreProfile', 'store_profile'),
  SyncSetting: createModel('SyncSetting', 'sync_settings'),
  StaffUser: createModel('StaffUser', 'staff_users'),
  Expense: createModel('Expense', 'expenses'),
  UserProfile: createModel('UserProfile', 'user_profiles'),
  AuthUser: createModel('AuthUser', 'auth_users'),
  Subscription: createModel('Subscription', 'subscriptions'),
  PaymentSettings: createModel('PaymentSettings', 'payment_settings')
};
