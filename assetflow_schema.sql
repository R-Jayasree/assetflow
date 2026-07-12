-- ============================================================
-- AssetFlow Enterprise Asset & Resource Management System

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing objects
DROP TABLE IF EXISTS audit_discrepancies;
DROP TABLE IF EXISTS audit_assignments;
DROP TABLE IF EXISTS audit_cycles;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS maintenance_requests;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS asset_transfers;
DROP TABLE IF EXISTS asset_allocations;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS asset_categories;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;

DROP PROCEDURE IF EXISTS sp_check_booking_overlap;
DROP PROCEDURE IF EXISTS sp_generate_asset_tag;
DROP PROCEDURE IF EXISTS sp_flag_overdue_allocations;
DROP PROCEDURE IF EXISTS sp_create_notification;

DROP VIEW IF EXISTS vw_booking_calendar;
DROP VIEW IF EXISTS vw_dashboard_kpis;
DROP VIEW IF EXISTS vw_overdue_returns;
DROP VIEW IF EXISTS vw_current_asset_holders;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) UNIQUE,
    parent_department_id INT NULL,
    department_head_id INT NULL,
    description TEXT,
    status ENUM('Active','Inactive') DEFAULT 'Active',
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_dept_status (status),
    INDEX idx_dept_parent (parent_department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- 2. EMPLOYEES (User Accounts)
-- ============================================================
CREATE TABLE employees (
    employee_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department_id INT,
    role ENUM('Admin','Asset_Manager','Department_Head','Employee') DEFAULT 'Employee',
    status ENUM('Active','Inactive') DEFAULT 'Active',
    profile_photo_url VARCHAR(500),
    last_login_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    INDEX idx_emp_email (email),
    INDEX idx_emp_dept (department_id),
    INDEX idx_emp_role (role),
    INDEX idx_emp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE departments ADD CONSTRAINT fk_dept_head FOREIGN KEY (department_head_id) REFERENCES employees(employee_id) ON DELETE SET NULL;

-- ============================================================
-- 3. ASSET CATEGORIES
-- ============================================================
CREATE TABLE asset_categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    category_code VARCHAR(20) UNIQUE,
    description TEXT,
    custom_fields_schema TEXT,
    depreciation_rate DECIMAL(5,2),
    status ENUM('Active','Inactive') DEFAULT 'Active',
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_cat_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- 4. ASSETS
-- ============================================================
CREATE TABLE assets (
    asset_id INT PRIMARY KEY AUTO_INCREMENT,
    asset_tag VARCHAR(20) NOT NULL UNIQUE,
    asset_name VARCHAR(200) NOT NULL,
    category_id INT NOT NULL,
    serial_number VARCHAR(100),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    acquisition_date DATE,
    acquisition_cost DECIMAL(15,2),
    current_condition ENUM('Excellent','Good','Fair','Poor','Damaged') DEFAULT 'Good',
    location VARCHAR(200),
    department_id INT,
    is_bookable TINYINT(1) DEFAULT 0,
    status ENUM('Available','Allocated','Reserved','Under_Maintenance','Lost','Retired','Disposed') DEFAULT 'Available',
    custom_field_values TEXT,
    photo_urls TEXT,
    document_urls TEXT,
    notes TEXT,
    created_by INT NOT NULL,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES asset_categories(category_id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    INDEX idx_asset_tag (asset_tag),
    INDEX idx_asset_status (status),
    INDEX idx_asset_category (category_id),
    INDEX idx_asset_dept (department_id),
    INDEX idx_asset_bookable (is_bookable),
    INDEX idx_asset_location (location),
    INDEX idx_asset_condition (current_condition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- 5. ASSET ALLOCATIONS
-- ============================================================
CREATE TABLE asset_allocations (
    allocation_id INT PRIMARY KEY AUTO_INCREMENT,
    asset_id INT NOT NULL,
    allocated_to_employee_id INT,
    allocated_to_department_id INT,
    allocated_by INT NOT NULL,
    allocation_date DATETIME,
    expected_return_date DATE,
    actual_return_date DATETIME,
    return_condition ENUM('Excellent','Good','Fair','Poor','Damaged'),
    return_notes TEXT,
    status ENUM('Active','Returned','Overdue') DEFAULT 'Active',
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE RESTRICT,
    FOREIGN KEY (allocated_to_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
    FOREIGN KEY (allocated_to_department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    FOREIGN KEY (allocated_by) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    INDEX idx_alloc_asset (asset_id),
    INDEX idx_alloc_employee (allocated_to_employee_id),
    INDEX idx_alloc_status (status),
    INDEX idx_alloc_return_date (expected_return_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- 6. ASSET TRANSFERS
-- ============================================================
CREATE TABLE asset_transfers (
    transfer_id INT PRIMARY KEY AUTO_INCREMENT,
    asset_id INT NOT NULL,
    from_allocation_id INT NOT NULL,
    from_employee_id INT,
    to_employee_id INT,
    to_department_id INT,
    requested_by INT NOT NULL,
    approved_by INT,
    request_date DATETIME,
    approval_date DATETIME,
    expected_return_date DATE,
    transfer_reason TEXT,
    status ENUM('Requested','Approved','Rejected','Completed','Cancelled') DEFAULT 'Requested',
    rejection_reason TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE RESTRICT,
    FOREIGN KEY (from_allocation_id) REFERENCES asset_allocations(allocation_id) ON DELETE RESTRICT,
    FOREIGN KEY (from_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
    FOREIGN KEY (to_employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
    FOREIGN KEY (to_department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    FOREIGN KEY (requested_by) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES employees(employee_id) ON DELETE SET NULL,
    INDEX idx_transfer_asset (asset_id),
    INDEX idx_transfer_status (status),
    INDEX idx_transfer_requested_by (requested_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- 7. BOOKINGS (Shared Resources)
-- ============================================================
CREATE TABLE bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    asset_id INT NOT NULL,
    booked_by INT NOT NULL,
    booked_for_dept_id INT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    purpose TEXT,
    status ENUM('Upcoming','Ongoing','Completed','Cancelled') DEFAULT 'Upcoming',
    cancelled_at DATETIME,
    cancellation_reason TEXT,
    reminder_sent TINYINT(1) DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE RESTRICT,
    FOREIGN KEY (booked_by) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    FOREIGN KEY (booked_for_dept_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    INDEX idx_booking_asset (asset_id),
    INDEX idx_booking_user (booked_by),
    INDEX idx_booking_status (status),
    INDEX idx_booking_times (start_time, end_time),
    INDEX idx_booking_overlap (asset_id, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- 8. MAINTENANCE REQUESTS
-- ============================================================
CREATE TABLE maintenance_requests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    asset_id INT NOT NULL,
    requested_by INT NOT NULL,
    approved_by INT,
    assigned_to INT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
    photo_urls TEXT,
    status ENUM('Pending','Approved','Rejected','Technician_Assigned','In_Progress','Resolved','Closed') DEFAULT 'Pending',
    rejection_reason TEXT,
    resolution_notes TEXT,
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    requested_at DATETIME,
    approved_at DATETIME,
    started_at DATETIME,
    resolved_at DATETIME,
    closed_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE RESTRICT,
    FOREIGN KEY (requested_by) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES employees(employee_id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES employees(employee_id) ON DELETE SET NULL,
    INDEX idx_maint_asset (asset_id),
    INDEX idx_maint_status (status),
    INDEX idx_maint_priority (priority),
    INDEX idx_maint_requested_by (requested_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- 9. AUDIT CYCLES
-- ============================================================
CREATE TABLE audit_cycles (
    audit_cycle_id INT PRIMARY KEY AUTO_INCREMENT,
    audit_name VARCHAR(200) NOT NULL,
    scope_type ENUM('Department','Location','Category','Organization') NOT NULL,
    scope_value VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('Planned','In_Progress','Completed','Closed') DEFAULT 'Planned',
    created_by INT NOT NULL,
    closed_at DATETIME,
    closure_notes TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    INDEX idx_audit_status (status),
    INDEX idx_audit_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- 10. AUDIT ASSIGNMENTS
-- ============================================================
CREATE TABLE audit_assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    audit_cycle_id INT NOT NULL,
    auditor_id INT NOT NULL,
    assigned_at DATETIME,
    status ENUM('Assigned','In_Progress','Completed') DEFAULT 'Assigned',
    FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(audit_cycle_id) ON DELETE CASCADE,
    FOREIGN KEY (auditor_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_auditor_cycle (audit_cycle_id, auditor_id),
    INDEX idx_assign_cycle (audit_cycle_id),
    INDEX idx_assign_auditor (auditor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- 11. AUDIT DISCREPANCIES
-- ============================================================
CREATE TABLE audit_discrepancies (
    discrepancy_id INT PRIMARY KEY AUTO_INCREMENT,
    audit_cycle_id INT NOT NULL,
    asset_id INT NOT NULL,
    auditor_id INT NOT NULL,
    expected_status ENUM('Available','Allocated','Reserved','Under_Maintenance','Lost','Retired','Disposed'),
    actual_status ENUM('Verified','Missing','Damaged','Wrong_Location','Unknown') NOT NULL,
    location_found VARCHAR(200),
    condition_found ENUM('Excellent','Good','Fair','Poor','Damaged'),
    notes TEXT,
    photo_urls TEXT,
    is_resolved TINYINT(1) DEFAULT 0,
    resolved_by INT,
    resolved_at DATETIME,
    resolution_action ENUM('Status_Updated','Maintenance_Raised','Reallocated','No_Action','Other'),
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(audit_cycle_id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE RESTRICT,
    FOREIGN KEY (auditor_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    FOREIGN KEY (resolved_by) REFERENCES employees(employee_id) ON DELETE SET NULL,
    INDEX idx_disc_cycle (audit_cycle_id),
    INDEX idx_disc_asset (asset_id),
    INDEX idx_disc_status (actual_status),
    INDEX idx_disc_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    recipient_id INT NOT NULL,
    notification_type ENUM('Asset_Assigned','Asset_Returned','Transfer_Requested','Transfer_Approved','Transfer_Rejected','Booking_Confirmed','Booking_Cancelled','Booking_Reminder','Maintenance_Approved','Maintenance_Rejected','Maintenance_Resolved','Overdue_Return','Audit_Assigned','Audit_Discrepancy_Flagged','Audit_Cycle_Closed','System_Alert') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type ENUM('Asset','Allocation','Transfer','Booking','Maintenance','Audit','Employee'),
    related_entity_id INT,
    is_read TINYINT(1) DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (recipient_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    INDEX idx_notif_recipient (recipient_id),
    INDEX idx_notif_type (notification_type),
    INDEX idx_notif_read (is_read),
    INDEX idx_notif_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- 13. ACTIVITY LOGS
-- ============================================================
CREATE TABLE activity_logs (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    actor_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    description TEXT,
    created_at DATETIME,
    FOREIGN KEY (actor_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    INDEX idx_log_actor (actor_id),
    INDEX idx_log_action (action),
    INDEX idx_log_entity (entity_type, entity_id),
    INDEX idx_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- VIEWS
-- ============================================================

CREATE VIEW vw_current_asset_holders AS 
SELECT a.asset_id, a.asset_tag, a.asset_name, a.status AS asset_status, a.current_condition, 
al.allocation_id, al.allocated_to_employee_id, CONCAT(e.first_name,' ',e.last_name) AS holder_name, 
e.email AS holder_email, al.allocated_to_department_id, d.department_name, al.allocation_date, 
al.expected_return_date, al.status AS allocation_status, 
CASE WHEN al.expected_return_date < CURDATE() AND al.status = 'Active' THEN 1 ELSE 0 END AS is_overdue 
FROM assets a 
LEFT JOIN asset_allocations al ON a.asset_id = al.asset_id AND al.status = 'Active' 
LEFT JOIN employees e ON al.allocated_to_employee_id = e.employee_id 
LEFT JOIN departments d ON al.allocated_to_department_id = d.department_id;

CREATE VIEW vw_overdue_returns AS 
SELECT * FROM vw_current_asset_holders WHERE is_overdue = 1;

CREATE VIEW vw_dashboard_kpis AS 
SELECT 
(SELECT COUNT(*) FROM assets WHERE status = 'Available') AS assets_available, 
(SELECT COUNT(*) FROM assets WHERE status = 'Allocated') AS assets_allocated, 
(SELECT COUNT(*) FROM assets WHERE status = 'Under_Maintenance') AS assets_under_maintenance, 
(SELECT COUNT(*) FROM assets WHERE status = 'Lost') AS assets_lost, 
(SELECT COUNT(*) FROM bookings WHERE status IN ('Upcoming','Ongoing')) AS active_bookings, 
(SELECT COUNT(*) FROM asset_transfers WHERE status = 'Requested') AS pending_transfers, 
(SELECT COUNT(*) FROM vw_overdue_returns) AS overdue_returns, 
(SELECT COUNT(*) FROM maintenance_requests WHERE status IN ('Pending','Approved','Technician_Assigned','In_Progress') AND DATE(requested_at) = CURDATE()) AS maintenance_today, 
(SELECT COUNT(*) FROM assets) AS total_assets;

CREATE VIEW vw_booking_calendar AS 
SELECT b.booking_id, b.asset_id, a.asset_name, a.asset_tag, b.booked_by, 
CONCAT(e.first_name,' ',e.last_name) AS booked_by_name, b.start_time, b.end_time, b.status, b.purpose 
FROM bookings b 
JOIN assets a ON b.asset_id = a.asset_id 
JOIN employees e ON b.booked_by = e.employee_id 
WHERE b.status IN ('Upcoming','Ongoing');

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER //

CREATE PROCEDURE sp_check_booking_overlap(IN p_asset_id INT, IN p_start_time DATETIME, IN p_end_time DATETIME, IN p_exclude_booking_id INT)
BEGIN
SELECT COUNT(*) AS overlap_count FROM bookings WHERE asset_id = p_asset_id AND status IN ('Upcoming','Ongoing') AND booking_id != IF(p_exclude_booking_id IS NULL, 0, p_exclude_booking_id) AND ((p_start_time >= start_time AND p_start_time < end_time) OR (p_end_time > start_time AND p_end_time <= end_time) OR (p_start_time <= start_time AND p_end_time >= end_time));
END //

CREATE PROCEDURE sp_generate_asset_tag(OUT p_asset_tag VARCHAR(20))
BEGIN
DECLARE v_next_num INT;
SELECT COALESCE(MAX(CAST(SUBSTRING(asset_tag, 4) AS UNSIGNED)), 0) + 1 INTO v_next_num FROM assets;
SET p_asset_tag = CONCAT('AF-', LPAD(v_next_num, 4, '0'));
END //

CREATE PROCEDURE sp_flag_overdue_allocations()
BEGIN
UPDATE asset_allocations SET status = 'Overdue' WHERE status = 'Active' AND expected_return_date IS NOT NULL AND expected_return_date < CURDATE();
END //

CREATE PROCEDURE sp_create_notification(IN p_recipient_id INT, IN p_type VARCHAR(50), IN p_title VARCHAR(200), IN p_message TEXT, IN p_entity_type VARCHAR(50), IN p_entity_id INT)
BEGIN
INSERT INTO notifications (recipient_id, notification_type, title, message, related_entity_type, related_entity_id) VALUES (p_recipient_id, p_type, p_title, p_message, p_entity_type, p_entity_id);
END //

DELIMITER ;

-- ============================================================
-- TRIGGERS
-- ============================================================

DELIMITER //

CREATE TRIGGER trg_asset_status_change AFTER UPDATE ON assets FOR EACH ROW 
BEGIN 
IF OLD.status != NEW.status THEN 
INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, old_values, new_values, description) 
VALUES (1, 'UPDATE', 'Asset', NEW.asset_id, CONCAT('{"status": "', OLD.status, '"}'), CONCAT('{"status": "', NEW.status, '"}'), CONCAT('Asset status changed from ', OLD.status, ' to ', NEW.status)); 
END IF; 
END //

CREATE TRIGGER trg_asset_allocated AFTER INSERT ON asset_allocations FOR EACH ROW 
BEGIN 
IF NEW.status = 'Active' THEN 
UPDATE assets SET status = 'Allocated' WHERE asset_id = NEW.asset_id; 
END IF; 
END //

CREATE TRIGGER trg_asset_returned AFTER UPDATE ON asset_allocations FOR EACH ROW 
BEGIN 
IF OLD.status = 'Active' AND NEW.status = 'Returned' THEN 
UPDATE assets SET status = 'Available', current_condition = IF(NEW.return_condition IS NULL, current_condition, NEW.return_condition) WHERE asset_id = NEW.asset_id; 
END IF; 
END //

CREATE TRIGGER trg_maintenance_approved AFTER UPDATE ON maintenance_requests FOR EACH ROW 
BEGIN 
IF OLD.status = 'Pending' AND NEW.status = 'Approved' THEN 
UPDATE assets SET status = 'Under_Maintenance' WHERE asset_id = NEW.asset_id; 
END IF; 
IF OLD.status IN ('In_Progress', 'Technician_Assigned') AND NEW.status = 'Resolved' THEN 
UPDATE assets SET status = 'Available' WHERE asset_id = NEW.asset_id; 
END IF; 
END //

DELIMITER ;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO employees (first_name, last_name, email, password_hash, role, status, created_at) 
VALUES ('System', 'Admin', 'admin@assetflow.com', '$2b$10$YourHashedPasswordHere', 'Admin', 'Active', NOW());

INSERT INTO departments (department_name, department_code, description, created_at) 
VALUES ('Information Technology', 'IT', 'IT infrastructure and support', NOW()), 
('Human Resources', 'HR', 'Employee management and recruitment', NOW()), 
('Finance', 'FIN', 'Financial operations and accounting', NOW()), 
('Operations', 'OPS', 'Day-to-day business operations', NOW()), 
('Facilities', 'FAC', 'Building and facilities management', NOW());

INSERT INTO asset_categories (category_name, category_code, description, custom_fields_schema, created_at) 
VALUES ('Electronics', 'ELEC', 'Computers, laptops, tablets, phones', '{"warranty_period_months": "number", "brand": "string", "model_year": "number"}', NOW()), 
('Furniture', 'FURN', 'Desks, chairs, cabinets, shelves', '{"material": "string", "dimensions": "string"}', NOW()), 
('Vehicles', 'VEH', 'Company cars, trucks, vans', '{"license_plate": "string", "mileage": "number", "fuel_type": "string"}', NOW()), 
('Office Equipment', 'OFFEQ', 'Printers, projectors, scanners', '{"warranty_period_months": "number", "connectivity": "string"}', NOW()), 
('Meeting Rooms', 'ROOM', 'Conference and meeting rooms', '{"capacity": "number", "has_projector": "boolean", "has_whiteboard": "boolean"}', NOW());