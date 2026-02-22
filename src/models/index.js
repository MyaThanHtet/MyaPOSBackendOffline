const mongoose = require('mongoose');

const baseOptions = {
  versionKey: false,
  timestamps: false
};

const applyBaseTransform = (schema, extraTransform) => {
  schema.set('toJSON', {
    transform: (doc, ret) => {
      delete ret._id;
      if (typeof extraTransform === 'function') {
        extraTransform(doc, ret);
      }
      return ret;
    }
  });
};

const createSchema = (definition, extraOptions = {}, extraTransform) => {
  const schema = new mongoose.Schema(definition, { ...baseOptions, ...extraOptions });
  applyBaseTransform(schema, extraTransform);
  return schema;
};

const menuItemSchema = createSchema({
  id: { type: String, required: true },
  name: { type: String },
  category: { type: String },
  price: { type: Number },
  total_sales: { type: Number },
  image_url: { type: String },
  updated_at: { type: Number },
  is_deleted: { type: Boolean, default: false },
  ownerId: { type: String, required: true }
});
menuItemSchema.index({ ownerId: 1, id: 1 }, { unique: true });
menuItemSchema.index({ ownerId: 1, updated_at: 1 });

const categorySchema = createSchema({
  id: { type: String, required: true },
  name: { type: String },
  updated_at: { type: Number },
  is_deleted: { type: Boolean, default: false },
  ownerId: { type: String, required: true }
});
categorySchema.index({ ownerId: 1, id: 1 }, { unique: true });
categorySchema.index({ ownerId: 1, updated_at: 1 });

const tableSchema = createSchema({
  id: { type: String, required: true },
  name: { type: String },
  capacity: { type: Number },
  status: { type: String },
  pos_x: { type: Number },
  pos_y: { type: Number },
  table_width: { type: Number },
  table_height: { type: Number },
  updated_at: { type: Number },
  is_deleted: { type: Boolean, default: false },
  zone_id: { type: String },
  ownerId: { type: String, required: true }
});
tableSchema.index({ ownerId: 1, id: 1 }, { unique: true });
tableSchema.index({ ownerId: 1, updated_at: 1 });

const tableZoneSchema = createSchema({
  id: { type: String, required: true },
  name: { type: String },
  updated_at: { type: Number },
  is_deleted: { type: Boolean, default: false },
  ownerId: { type: String, required: true }
});
tableZoneSchema.index({ ownerId: 1, id: 1 }, { unique: true });
tableZoneSchema.index({ ownerId: 1, updated_at: 1 });

const billSchema = createSchema({
  id: { type: String, required: true },
  table_id: { type: String },
  subtotal: { type: Number },
  discount_amount: { type: Number },
  tax_amount: { type: Number },
  table_service_charge: { type: Number },
  table_usage_duration: { type: String },
  total: { type: Number },
  status: { type: String },
  created_at: { type: Number },
  updated_at: { type: Number },
  ownerId: { type: String, required: true }
});
billSchema.index({ ownerId: 1, id: 1 }, { unique: true });
billSchema.index({ ownerId: 1, updated_at: 1 });

const billItemSchema = createSchema({
  id: { type: String, required: true },
  bill_id: { type: String },
  menu_item_id: { type: String },
  name: { type: String },
  category: { type: String },
  price: { type: Number },
  quantity: { type: Number },
  subtotal: { type: Number },
  created_at: { type: Number },
  ownerId: { type: String, required: true }
});
billItemSchema.index({ ownerId: 1, id: 1 }, { unique: true });
billItemSchema.index({ ownerId: 1, created_at: 1 });

const invoiceVoidSchema = createSchema({
  id: { type: String, required: true },
  bill_id: { type: String },
  reason: { type: String },
  created_at: { type: Number },
  ownerId: { type: String, required: true }
});
invoiceVoidSchema.index({ ownerId: 1, id: 1 }, { unique: true });
invoiceVoidSchema.index({ ownerId: 1, created_at: 1 });

const paymentSchema = createSchema({
  id: { type: String, required: true },
  bill_id: { type: String },
  amount: { type: Number },
  method: { type: String },
  created_at: { type: Number },
  ownerId: { type: String, required: true }
});
paymentSchema.index({ ownerId: 1, id: 1 }, { unique: true });
paymentSchema.index({ ownerId: 1, created_at: 1 });

const paymentMethodSchema = createSchema({
  id: { type: String, required: true },
  name: { type: String },
  icon_key: { type: String },
  is_active: { type: Boolean },
  updated_at: { type: Number },
  is_deleted: { type: Boolean, default: false },
  ownerId: { type: String, required: true }
});
paymentMethodSchema.index({ ownerId: 1, id: 1 }, { unique: true });
paymentMethodSchema.index({ ownerId: 1, updated_at: 1 });

const inventoryItemSchema = createSchema({
  id: { type: String, required: true },
  name: { type: String },
  sku: { type: String },
  quantity: { type: Number },
  unit: { type: String },
  updated_at: { type: Number },
  is_deleted: { type: Boolean, default: false },
  ownerId: { type: String, required: true }
});
inventoryItemSchema.index({ ownerId: 1, id: 1 }, { unique: true });
inventoryItemSchema.index({ ownerId: 1, updated_at: 1 });

const recipeItemSchema = createSchema({
  id: { type: String, required: true },
  menu_item_id: { type: String },
  inventory_item_id: { type: String },
  quantity: { type: Number },
  unit: { type: String },
  updated_at: { type: Number },
  ownerId: { type: String, required: true }
});
recipeItemSchema.index({ ownerId: 1, id: 1 }, { unique: true });
recipeItemSchema.index({ ownerId: 1, updated_at: 1 });

const inventoryWasteSchema = createSchema({
  id: { type: String, required: true },
  inventory_item_id: { type: String },
  quantity: { type: Number },
  unit: { type: String },
  reason: { type: String },
  status: { type: String },
  void_reason: { type: String },
  voided_at: { type: Number },
  created_at: { type: Number },
  ownerId: { type: String, required: true }
});
inventoryWasteSchema.index({ ownerId: 1, id: 1 }, { unique: true });
inventoryWasteSchema.index({ ownerId: 1, created_at: 1 });

const inventoryDeductionSchema = createSchema({
  bill_id: { type: String, required: true },
  created_at: { type: Number },
  ownerId: { type: String, required: true }
});
inventoryDeductionSchema.index({ ownerId: 1, bill_id: 1 }, { unique: true });
inventoryDeductionSchema.index({ ownerId: 1, created_at: 1 });

const pricingSettingSchema = createSchema({
  id: { type: String, required: true },
  tax_rate: { type: Number },
  tax_type: { type: String },
  table_service_charge_enabled: { type: Boolean, default: false },
  table_service_rate_per_hour: { type: Number, default: 0, min: 0 },
  table_service_grace_period_minutes: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'table_service_grace_period_minutes must be an integer'
    }
  },
  table_service_minimum_charge: { type: Number, default: 0, min: 0 },
  updated_at: { type: Number },
  ownerId: { type: String, required: true }
});
pricingSettingSchema.index({ ownerId: 1, id: 1 }, { unique: true });
pricingSettingSchema.index({ ownerId: 1, updated_at: 1 });

const discountRuleSchema = createSchema({
  id: { type: String, required: true },
  name: { type: String },
  type: { type: String },
  value: { type: Number },
  is_active: { type: Boolean },
  updated_at: { type: Number },
  is_deleted: { type: Boolean, default: false },
  ownerId: { type: String, required: true }
});
discountRuleSchema.index({ ownerId: 1, id: 1 }, { unique: true });
discountRuleSchema.index({ ownerId: 1, updated_at: 1 });

const businessRuleSchema = createSchema({
  id: { type: String, required: true },
  auto_deduct_enabled: { type: Boolean },
  low_stock_alerts_enabled: { type: Boolean },
  low_stock_threshold: { type: Number },
  waste_management_enabled: { type: Boolean },
  updated_at: { type: Number },
  ownerId: { type: String, required: true }
});
businessRuleSchema.index({ ownerId: 1, id: 1 }, { unique: true });
businessRuleSchema.index({ ownerId: 1, updated_at: 1 });

const deliveryPlatformSchema = createSchema({
  id: { type: String, required: true },
  name: { type: String },
  updated_at: { type: Number },
  is_deleted: { type: Boolean, default: false },
  ownerId: { type: String, required: true }
});
deliveryPlatformSchema.index({ ownerId: 1, id: 1 }, { unique: true });
deliveryPlatformSchema.index({ ownerId: 1, updated_at: 1 });

const receiptConfigSchema = createSchema(
  {
    id: { type: String, required: true },
    paper_size: { type: String },
    header_text: { type: String },
    footer_text: { type: String },
    show_tax: { type: Boolean },
    show_discount: { type: Boolean },
    show_cashier: { type: Boolean },
    logo_bytes: { type: Buffer },
    updated_at: { type: Number },
    ownerId: { type: String, required: true }
  },
  {},
  (doc, ret) => {
    if (ret.logo_bytes && Buffer.isBuffer(ret.logo_bytes)) {
      ret.logo_bytes = ret.logo_bytes.toString('base64');
    }
  }
);
receiptConfigSchema.index({ ownerId: 1, id: 1 }, { unique: true });
receiptConfigSchema.index({ ownerId: 1, updated_at: 1 });

const printerSettingSchema = createSchema({
  id: { type: String, required: true },
  device_id: { type: String },
  device_name: { type: String },
  connection_type: { type: String },
  auto_reconnect: { type: Boolean },
  updated_at: { type: Number },
  ownerId: { type: String, required: true }
});
printerSettingSchema.index({ ownerId: 1, id: 1 }, { unique: true });
printerSettingSchema.index({ ownerId: 1, updated_at: 1 });

const storeProfileSchema = createSchema({
  id: { type: String, required: true },
  name: { type: String },
  address: { type: String },
  phone: { type: String },
  currency: { type: String },
  currency_symbol: { type: String },
  currency_symbol_position: { type: String },
  currency_decimal_places: { type: Number },
  currency_use_grouping: { type: Boolean },
  updated_at: { type: Number },
  ownerId: { type: String, required: true }
});
storeProfileSchema.index({ ownerId: 1, id: 1 }, { unique: true });
storeProfileSchema.index({ ownerId: 1, updated_at: 1 });

const syncSettingSchema = createSchema({
  id: { type: String, required: true },
  is_auto_sync_enabled: { type: Boolean },
  interval_seconds: { type: Number },
  updated_at: { type: Number },
  ownerId: { type: String, required: true }
});
syncSettingSchema.index({ ownerId: 1, id: 1 }, { unique: true });
syncSettingSchema.index({ ownerId: 1, updated_at: 1 });

const staffUserSchema = createSchema({
  id: { type: String, required: true },
  name: { type: String },
  email: { type: String },
  role: { type: String },
  permissions: { type: String },
  is_active: { type: Boolean },
  auth_uid: { type: String },
  updated_at: { type: Number },
  is_deleted: { type: Boolean, default: false },
  ownerId: { type: String, required: true }
});
staffUserSchema.index({ ownerId: 1, id: 1 }, { unique: true });
staffUserSchema.index({ ownerId: 1, updated_at: 1 });

const expenseSchema = createSchema({
  id: { type: String, required: true },
  ownerId: { type: String, required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  note: { type: String },
  spentAt: { type: Number, required: true },
  updatedAt: { type: Number, required: true },
  isDeleted: { type: Boolean, default: false }
});
expenseSchema.index({ ownerId: 1, id: 1 }, { unique: true });
expenseSchema.index({ ownerId: 1, updatedAt: 1 });
expenseSchema.index({ ownerId: 1, spentAt: 1 });
expenseSchema.index({ ownerId: 1, category: 1, spentAt: 1 });

const userProfileSchema = createSchema({
  uid: { type: String, required: true },
  email: { type: String },
  emailLower: { type: String },
  ownerEmail: { type: String },
  ownerId: { type: String },
  role: { type: String },
  permissions: { type: mongoose.Schema.Types.Mixed },
  isSuperAdmin: { type: Boolean },
  updatedAt: { type: Number }
});
userProfileSchema.index({ uid: 1 }, { unique: true });
userProfileSchema.index({ ownerEmail: 1 });

const authUserSchema = createSchema({
  uid: { type: String, required: true },
  email: { type: String },
  emailLower: { type: String },
  password_hash: { type: String, required: true },
  role: { type: String, default: 'user' },
  ownerId: { type: String },
  created_at: { type: Number },
  updated_at: { type: Number }
});
authUserSchema.index({ uid: 1 }, { unique: true });
authUserSchema.index({ emailLower: 1 }, { unique: true });
authUserSchema.index({ ownerId: 1 });

const subscriptionSchema = createSchema({
  uid: { type: String, required: true },
  isPremium: { type: Boolean },
  expiryDate: { type: Number },
  planName: { type: String },
  updatedAt: { type: Number }
});
subscriptionSchema.index({ uid: 1 }, { unique: true });

const paymentSettingsSchema = createSchema({
  companyName: { type: String, default: '' },
  kpayPhone: { type: String },
  viberNumber: { type: String },
  telegramUsername: { type: String },
  price1Month: { type: Number },
  price3Months: { type: Number },
  price6Months: { type: Number },
  price12Months: { type: Number },
  updatedAt: { type: Number }
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Category = mongoose.model('Category', categorySchema);
const Table = mongoose.model('Table', tableSchema);
const TableZone = mongoose.model('TableZone', tableZoneSchema);
const Bill = mongoose.model('Bill', billSchema);
const BillItem = mongoose.model('BillItem', billItemSchema);
const InvoiceVoid = mongoose.model('InvoiceVoid', invoiceVoidSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
const RecipeItem = mongoose.model('RecipeItem', recipeItemSchema);
const InventoryWaste = mongoose.model('InventoryWaste', inventoryWasteSchema);
const InventoryDeduction = mongoose.model('InventoryDeduction', inventoryDeductionSchema);
const PricingSetting = mongoose.model('PricingSetting', pricingSettingSchema);
const DiscountRule = mongoose.model('DiscountRule', discountRuleSchema);
const BusinessRule = mongoose.model('BusinessRule', businessRuleSchema);
const DeliveryPlatform = mongoose.model('DeliveryPlatform', deliveryPlatformSchema);
const ReceiptConfig = mongoose.model('ReceiptConfig', receiptConfigSchema);
const PrinterSetting = mongoose.model('PrinterSetting', printerSettingSchema);
const StoreProfile = mongoose.model('StoreProfile', storeProfileSchema);
const SyncSetting = mongoose.model('SyncSetting', syncSettingSchema);
const StaffUser = mongoose.model('StaffUser', staffUserSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const UserProfile = mongoose.model('UserProfile', userProfileSchema);
const AuthUser = mongoose.model('AuthUser', authUserSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const PaymentSettings = mongoose.model('PaymentSettings', paymentSettingsSchema);

module.exports = {
  MenuItem,
  Category,
  Table,
  TableZone,
  Bill,
  BillItem,
  InvoiceVoid,
  Payment,
  PaymentMethod,
  InventoryItem,
  RecipeItem,
  InventoryWaste,
  InventoryDeduction,
  PricingSetting,
  DiscountRule,
  BusinessRule,
  DeliveryPlatform,
  ReceiptConfig,
  PrinterSetting,
  StoreProfile,
  SyncSetting,
  StaffUser,
  Expense,
  UserProfile,
  AuthUser,
  Subscription,
  PaymentSettings
};
