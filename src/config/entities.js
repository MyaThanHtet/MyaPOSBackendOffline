const models = require('../models');
const { normalizeExpensePayload } = require('../utils/expenseValidation');
const {
  normalizePricingSettingInput,
  withPricingSettingDefaults
} = require('../utils/pricingSettingValidation');

const entityConfigs = {
  menu_items: {
    entity: 'menu_items',
    path: '/menu-items',
    model: models.MenuItem,
    timeField: 'updated_at',
    supportsDeleted: true,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  categories: {
    entity: 'categories',
    path: '/categories',
    model: models.Category,
    timeField: 'updated_at',
    supportsDeleted: true,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  tables: {
    entity: 'tables',
    path: '/tables',
    model: models.Table,
    timeField: 'updated_at',
    supportsDeleted: true,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  table_zones: {
    entity: 'table_zones',
    path: '/table-zones',
    model: models.TableZone,
    timeField: 'updated_at',
    supportsDeleted: true,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  bills: {
    entity: 'bills',
    path: '/bills',
    model: models.Bill,
    timeField: 'updated_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  bill_items: {
    entity: 'bill_items',
    path: '/bill-items',
    model: models.BillItem,
    timeField: 'created_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: ['bill_id']
  },
  invoice_voids: {
    entity: 'invoice_voids',
    path: '/invoice-voids',
    model: models.InvoiceVoid,
    timeField: 'created_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  payments: {
    entity: 'payments',
    path: '/payments',
    model: models.Payment,
    timeField: 'created_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: ['bill_id']
  },
  payment_methods: {
    entity: 'payment_methods',
    path: '/payment-methods',
    model: models.PaymentMethod,
    timeField: 'updated_at',
    supportsDeleted: true,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  inventory_items: {
    entity: 'inventory_items',
    path: '/inventory-items',
    model: models.InventoryItem,
    timeField: 'updated_at',
    supportsDeleted: true,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  recipe_items: {
    entity: 'recipe_items',
    path: '/recipe-items',
    model: models.RecipeItem,
    timeField: 'updated_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  inventory_waste: {
    entity: 'inventory_waste',
    path: '/inventory-waste',
    model: models.InventoryWaste,
    timeField: 'created_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  inventory_deductions: {
    entity: 'inventory_deductions',
    path: '/inventory-deductions',
    model: models.InventoryDeduction,
    timeField: 'created_at',
    supportsDeleted: false,
    idField: 'bill_id',
    paramName: 'bill_id',
    allowDelete: true,
    extraFilters: ['bill_id']
  },
  pricing_settings: {
    entity: 'pricing_settings',
    path: '/pricing-settings',
    model: models.PricingSetting,
    timeField: 'updated_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: false,
    extraFilters: [],
    transformInput: (data) => {
      normalizePricingSettingInput(data);
      return data;
    },
    transformOutput: (doc) => withPricingSettingDefaults(doc)
  },
  discount_rules: {
    entity: 'discount_rules',
    path: '/discount-rules',
    model: models.DiscountRule,
    timeField: 'updated_at',
    supportsDeleted: true,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  business_rules: {
    entity: 'business_rules',
    path: '/business-rules',
    model: models.BusinessRule,
    timeField: 'updated_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: false,
    extraFilters: []
  },
  delivery_platforms: {
    entity: 'delivery_platforms',
    path: '/delivery-platforms',
    model: models.DeliveryPlatform,
    timeField: 'updated_at',
    supportsDeleted: true,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  receipt_config: {
    entity: 'receipt_config',
    path: '/receipt-config',
    model: models.ReceiptConfig,
    timeField: 'updated_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: false,
    extraFilters: [],
    transformInput: (data) => {
      if (data.logo_bytes && typeof data.logo_bytes === 'string') {
        data.logo_bytes = Buffer.from(data.logo_bytes, 'base64');
      }
      return data;
    },
    transformOutput: (doc) => {
      if (doc?.logo_bytes && Buffer.isBuffer(doc.logo_bytes)) {
        return { ...doc, logo_bytes: doc.logo_bytes.toString('base64') };
      }
      return doc;
    }
  },
  printer_settings: {
    entity: 'printer_settings',
    path: '/printer-settings',
    model: models.PrinterSetting,
    timeField: 'updated_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: false,
    extraFilters: []
  },
  store_profile: {
    entity: 'store_profile',
    path: '/store-profile',
    model: models.StoreProfile,
    timeField: 'updated_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: false,
    extraFilters: []
  },
  sync_settings: {
    entity: 'sync_settings',
    path: '/sync-settings',
    model: models.SyncSetting,
    timeField: 'updated_at',
    supportsDeleted: false,
    idField: 'id',
    paramName: 'id',
    allowDelete: false,
    extraFilters: []
  },
  staff_users: {
    entity: 'staff_users',
    path: '/staff-users',
    model: models.StaffUser,
    timeField: 'updated_at',
    supportsDeleted: true,
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: []
  },
  expenses: {
    entity: 'expenses',
    path: null,
    model: models.Expense,
    timeField: 'updatedAt',
    supportsDeleted: true,
    deletedField: 'isDeleted',
    idField: 'id',
    paramName: 'id',
    allowDelete: true,
    extraFilters: [],
    transformInput: (data) => {
      const normalized = normalizeExpensePayload(data);
      Object.assign(data, normalized);
      return data;
    }
  }
};

const syncEntities = [
  'menu_items',
  'tables',
  'table_zones',
  'inventory_items',
  'bills',
  'payments',
  'categories',
  'expenses',
  'delivery_platforms',
  'bill_items',
  'recipe_items',
  'inventory_waste',
  'pricing_settings',
  'discount_rules',
  'payment_methods',
  'invoice_voids',
  'inventory_deductions',
  'business_rules',
  'receipt_config',
  'printer_settings',
  'store_profile',
  'staff_users',
  'sync_settings'
];

module.exports = {
  entityConfigs,
  syncEntities
};
