-- Migration: Create Smart Inventory Tables
-- Run this script to initialize the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Inventories table
CREATE TABLE IF NOT EXISTS inventories (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    customer VARCHAR(255) NOT NULL,
    physical_stock INTEGER NOT NULL DEFAULT 0,
    allocated_stock INTEGER NOT NULL DEFAULT 0,
    available_stock INTEGER GENERATED ALWAYS AS (physical_stock - allocated_stock) STORED,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_physical_stock CHECK (physical_stock >= 0),
    CONSTRAINT chk_allocated_stock CHECK (allocated_stock >= 0),
    CONSTRAINT chk_allocated_le_physical CHECK (allocated_stock <= physical_stock)
);

-- Stock In table
CREATE TABLE IF NOT EXISTS stock_ins (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    inventory_id VARCHAR(36) NOT NULL REFERENCES inventories(id),
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    customer VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'IN_PROGRESS', 'DONE', 'CANCELLED')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock In Logs table (audit trail)
CREATE TABLE IF NOT EXISTS stock_in_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    stock_in_id VARCHAR(36) NOT NULL REFERENCES stock_ins(id),
    old_status VARCHAR(20) DEFAULT '',
    new_status VARCHAR(20) NOT NULL,
    changed_by VARCHAR(100) NOT NULL DEFAULT 'system',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Out table
CREATE TABLE IF NOT EXISTS stock_outs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    inventory_id VARCHAR(36) NOT NULL REFERENCES inventories(id),
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    customer VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ALLOCATED', 'IN_PROGRESS', 'DONE', 'CANCELLED')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Out Logs table (audit trail)
CREATE TABLE IF NOT EXISTS stock_out_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    stock_out_id VARCHAR(36) NOT NULL REFERENCES stock_outs(id),
    old_status VARCHAR(20) DEFAULT '',
    new_status VARCHAR(20) NOT NULL,
    changed_by VARCHAR(100) NOT NULL DEFAULT 'system',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventories_sku ON inventories(sku);
CREATE INDEX IF NOT EXISTS idx_inventories_customer ON inventories(customer);
CREATE INDEX IF NOT EXISTS idx_inventories_name ON inventories(name);
CREATE INDEX IF NOT EXISTS idx_stock_ins_inventory_id ON stock_ins(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_ins_status ON stock_ins(status);
CREATE INDEX IF NOT EXISTS idx_stock_in_logs_stock_in_id ON stock_in_logs(stock_in_id);
CREATE INDEX IF NOT EXISTS idx_stock_outs_inventory_id ON stock_outs(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_outs_status ON stock_outs(status);
CREATE INDEX IF NOT EXISTS idx_stock_out_logs_stock_out_id ON stock_out_logs(stock_out_id);