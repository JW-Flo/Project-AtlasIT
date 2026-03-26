PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE qa_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT UNIQUE NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    pipeline_version TEXT,
    total_iterations INTEGER,
    status TEXT CHECK(status IN ('running', 'completed', 'failed', 'aborted')),
    total_phases INTEGER,
    passed_phases INTEGER,
    failed_phases INTEGER,
    duration_ms INTEGER,
    trigger_type TEXT CHECK(trigger_type IN ('manual', 'git-hook', 'scheduled', 'deployment', 'monitoring')),
    git_commit TEXT,
    branch TEXT,
    environment TEXT DEFAULT 'production',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, deployment_type TEXT CHECK(deployment_type IN ('minor', 'major', 'hotfix', 'rollback')) DEFAULT 'minor', component_logs_count INTEGER DEFAULT 0, log_severity_breakdown TEXT);
INSERT INTO qa_runs VALUES(1,'qa-1754513798804-ppfk4z00l','2025-08-06 20:56:38','1.0.0',1,'running',10,0,0,NULL,'manual',NULL,'main','production','2025-08-06 20:56:38','2025-08-06 20:56:38','minor',0,NULL);
CREATE TABLE qa_phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    iteration INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    phase_order INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'running', 'passed', 'failed', 'skipped', 'retrying')),
    start_time DATETIME,
    end_time DATETIME,
    duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    details TEXT, -- JSON string with detailed results
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);
INSERT INTO qa_phases VALUES(1,'qa-1754513798804-ppfk4z00l',1,'Website Diagnostics',1,'passed','2025-08-06T20:56:38.880Z','2025-08-06T20:56:39.562Z',682,0,NULL,'{"startTime":"2025-08-06T20:56:38.880Z","endTime":"2025-08-06T20:56:39.562Z","durationMs":682,"diagnostics":{"timestamp":"2025-08-06T20:56:38.927Z","url":"https://ab99ceea.awhittlewandering-frontend.pages.dev","checks":{"availability":{"status":"pass","statusCode":200,"responseTime":67},"contentType":{"status":"pass","value":"text/html; charset=utf-8"},"performance":{"status":"pass","responseTime":67,"threshold":5000},"htmlStructure":{"status":"pass","hasTitle":true,"hasBody":true},"javascript":{"status":"pass","hasScripts":true}},"severity":"info"}}','2025-08-06 20:56:39');
INSERT INTO qa_phases VALUES(2,'qa-1754513798804-ppfk4z00l',1,'API Backend',3,'failed','2025-08-06T20:56:39.865Z','2025-08-06T20:56:40.698Z',833,0,NULL,'{"startTime":"2025-08-06T20:56:39.865Z","endTime":"2025-08-06T20:56:40.698Z","durationMs":833,"apiResults":{"health":true,"teslaData":false,"healthData":{"status":"ok","timestamp":1754513800091,"service":"A Whittle Wandering API"},"allEndpointsWorking":false}}','2025-08-06 20:56:40');
CREATE TABLE qa_test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    phase_id INTEGER NOT NULL,
    test_name TEXT NOT NULL,
    test_type TEXT CHECK(test_type IN ('unit', 'integration', 'api', 'e2e', 'security', 'performance')),
    status TEXT CHECK(status IN ('passed', 'failed', 'skipped', 'timeout', 'error')),
    execution_time_ms INTEGER,
    assertion_count INTEGER,
    passed_assertions INTEGER,
    failed_assertions INTEGER,
    error_message TEXT,
    stack_trace TEXT,
    screenshot_url TEXT,
    test_data TEXT, -- JSON string with test input/output
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id),
    FOREIGN KEY (phase_id) REFERENCES qa_phases(id)
);
CREATE TABLE qa_performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_unit TEXT,
    endpoint_url TEXT,
    response_time_ms INTEGER,
    status_code INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);
INSERT INTO qa_performance_metrics VALUES(1,'qa-1754513798804-ppfk4z00l','response_time',67,'ms','https://ab99ceea.awhittlewandering-frontend.pages.dev',67,NULL,'2025-08-06 20:56:39');
INSERT INTO qa_performance_metrics VALUES(2,'qa-1754513798804-ppfk4z00l','api_response_time',833,'ms','https://awhittlewandering-api.kd8jc7v8cd.workers.dev/health',NULL,NULL,'2025-08-06 20:56:40');
CREATE TABLE qa_security_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    scan_type TEXT NOT NULL,
    vulnerability_level TEXT CHECK(vulnerability_level IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    affected_component TEXT,
    recommendation TEXT,
    status TEXT CHECK(status IN ('open', 'resolved', 'accepted_risk', 'false_positive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);
CREATE TABLE qa_deployment_validations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    deployment_id TEXT,
    environment TEXT,
    deployment_status TEXT,
    health_check_url TEXT,
    health_check_status INTEGER,
    response_time_ms INTEGER,
    validation_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    rollback_required BOOLEAN DEFAULT FALSE,
    rollback_reason TEXT,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);
CREATE TABLE qa_monitoring_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id TEXT UNIQUE NOT NULL,
    run_id TEXT,
    alert_type TEXT CHECK(alert_type IN ('performance', 'availability', 'error_rate', 'security', 'custom')),
    severity TEXT CHECK(severity IN ('info', 'warning', 'error', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    affected_service TEXT,
    metric_value REAL,
    threshold_value REAL,
    status TEXT CHECK(status IN ('active', 'resolved', 'acknowledged', 'suppressed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);
INSERT INTO qa_monitoring_alerts VALUES(1,'alert-1754513783035-cw4c4q',NULL,'error_rate','critical','QA Diagnosis System Failure','QA diagnosis script failed: Failed to start QA run: D1_ERROR: CHECK constraint failed: trigger_type IN (''manual'', ''git-hook'', ''scheduled'', ''deployment'', ''monitoring''): SQLITE_CONSTRAINT','qa-system',NULL,NULL,'active','2025-08-06 20:56:23',NULL);
INSERT INTO qa_monitoring_alerts VALUES(2,'alert-1754513799502-zjb2tb','qa-1754513798804-ppfk4z00l','error_rate','critical','Frontend JavaScript Not Working','JavaScript bundle or API connectivity issues detected','https://ab99ceea.awhittlewandering-frontend.pages.dev',NULL,NULL,'active','2025-08-06 20:56:39',NULL);
CREATE TABLE qa_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type TEXT CHECK(config_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    environment TEXT DEFAULT 'global',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO qa_config VALUES(1,'max_iterations','5','number','Maximum number of recursive QA iterations','global','2025-08-06 20:54:05');
INSERT INTO qa_config VALUES(2,'retry_limit','3','number','Maximum retries per phase','global','2025-08-06 20:54:05');
INSERT INTO qa_config VALUES(3,'timeout_ms','300000','number','Default timeout for QA phases in milliseconds','global','2025-08-06 20:54:05');
INSERT INTO qa_config VALUES(4,'enable_e2e','true','boolean','Enable end-to-end testing','global','2025-08-06 20:54:05');
INSERT INTO qa_config VALUES(5,'enable_performance','true','boolean','Enable performance testing','global','2025-08-06 20:54:05');
INSERT INTO qa_config VALUES(6,'enable_security','true','boolean','Enable security scanning','global','2025-08-06 20:54:05');
INSERT INTO qa_config VALUES(7,'notification_webhook','','string','Webhook URL for QA notifications','global','2025-08-06 20:54:05');
INSERT INTO qa_config VALUES(8,'dashboard_url','https://ab99ceea.awhittlewandering-frontend.pages.dev','string','Frontend dashboard URL','global','2025-08-06 20:54:05');
INSERT INTO qa_config VALUES(9,'api_url','https://awhittlewandering-api.kd8jc7v8cd.workers.dev','string','Backend API URL','global','2025-08-06 20:54:05');
INSERT INTO qa_config VALUES(10,'major_deployment_qa_enabled','true','boolean','Enable automatic QA runs for major deployments','global','2025-08-06 21:04:50');
INSERT INTO qa_config VALUES(11,'tessie_api_timeout_ms','10000','number','Timeout for Tessie API calls in milliseconds','global','2025-08-06 21:04:50');
INSERT INTO qa_config VALUES(12,'tessie_api_retry_count','3','number','Number of retries for failed Tessie API calls','global','2025-08-06 21:04:50');
INSERT INTO qa_config VALUES(13,'log_retention_days','90','number','Number of days to retain component logs','global','2025-08-06 21:04:50');
INSERT INTO qa_config VALUES(14,'error_alert_threshold','10','number','Number of errors to trigger alert','global','2025-08-06 21:04:50');
INSERT INTO qa_config VALUES(15,'component_log_level','info','string','Minimum log level to store (debug, info, warn, error, critical)','global','2025-08-06 21:04:50');
INSERT INTO qa_config VALUES(16,'deployment_notification_webhook','','string','Webhook URL for deployment notifications','global','2025-08-06 21:04:50');
INSERT INTO qa_config VALUES(17,'tessie_api_base_url','https://api.tessie.com','string','Base URL for Tessie API','global','2025-08-06 21:04:50');
INSERT INTO qa_config VALUES(18,'tesla_vin','','string','Tesla Vehicle VIN for API calls','global','2025-08-06 21:04:50');
INSERT INTO qa_config VALUES(19,'enable_performance_monitoring','true','boolean','Enable detailed performance monitoring','global','2025-08-06 21:04:50');
INSERT INTO qa_config VALUES(20,'enable_tessie_health_checks','true','boolean','Enable continuous Tessie API health monitoring','global','2025-08-06 21:04:50');
CREATE TABLE component_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT, -- Optional: can be null for standalone component logs
    component_name TEXT NOT NULL,
    service_type TEXT CHECK(service_type IN ('frontend', 'backend', 'qa', 'deployment', 'monitoring', 'database', 'api', 'worker')),
    log_level TEXT CHECK(log_level IN ('debug', 'info', 'warn', 'error', 'critical')) NOT NULL,
    message TEXT NOT NULL,
    details TEXT, -- JSON string with additional context
    error_stack TEXT,
    request_id TEXT,
    user_id TEXT,
    session_id TEXT,
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    response_time_ms INTEGER,
    memory_usage_mb REAL,
    cpu_usage_percent REAL,
    database_query_count INTEGER,
    external_api_calls INTEGER,
    cache_hits INTEGER,
    cache_misses INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_file TEXT,
    source_line INTEGER,
    source_function TEXT,
    environment TEXT DEFAULT 'production',
    version TEXT,
    git_commit TEXT,
    deployment_id TEXT,
    correlation_id TEXT, -- For tracing related logs across components
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);
CREATE TABLE deployment_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deployment_id TEXT UNIQUE NOT NULL,
    deployment_type TEXT CHECK(deployment_type IN ('minor', 'major', 'hotfix', 'rollback')) NOT NULL,
    component TEXT NOT NULL, -- frontend, backend, qa, etc.
    version TEXT NOT NULL,
    git_commit TEXT NOT NULL,
    git_branch TEXT DEFAULT 'main',
    triggered_by TEXT, -- user or automated system
    trigger_reason TEXT,
    deployment_status TEXT CHECK(deployment_status IN ('initiated', 'building', 'testing', 'deploying', 'completed', 'failed', 'rolled_back')) DEFAULT 'initiated',
    qa_run_id TEXT, -- Link to QA run triggered by this deployment
    pre_deployment_checks TEXT, -- JSON with check results
    post_deployment_validation TEXT, -- JSON with validation results
    rollback_plan TEXT,
    environment TEXT DEFAULT 'production',
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    duration_ms INTEGER,
    artifacts_urls TEXT, -- JSON array of build artifact URLs
    deployment_notes TEXT,
    health_check_url TEXT,
    health_check_status INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qa_run_id) REFERENCES qa_runs(run_id)
);
CREATE TABLE api_health_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT,
    endpoint_name TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    method TEXT DEFAULT 'GET',
    status_code INTEGER,
    response_time_ms INTEGER,
    payload_size_bytes INTEGER,
    error_message TEXT,
    tessie_api_working BOOLEAN,
    tesla_data_available BOOLEAN,
    database_responsive BOOLEAN,
    cache_working BOOLEAN,
    external_dependencies_up BOOLEAN,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    environment TEXT DEFAULT 'production',
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);
CREATE TABLE log_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_run_id TEXT NOT NULL,
    time_range_start DATETIME,
    time_range_end DATETIME,
    total_logs_analyzed INTEGER,
    error_patterns TEXT, -- JSON with detected error patterns
    performance_trends TEXT, -- JSON with performance analysis
    anomalies_detected TEXT, -- JSON with detected anomalies
    recommendations TEXT, -- JSON with improvement suggestions
    tessie_api_reliability REAL, -- Percentage of successful Tessie calls
    api_success_rates TEXT, -- JSON with success rates per endpoint
    average_response_times TEXT, -- JSON with response time analysis
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('qa_config',20);
INSERT INTO sqlite_sequence VALUES('qa_monitoring_alerts',2);
INSERT INTO sqlite_sequence VALUES('qa_runs',1);
INSERT INTO sqlite_sequence VALUES('qa_performance_metrics',2);
INSERT INTO sqlite_sequence VALUES('qa_phases',2);
CREATE INDEX idx_qa_runs_timestamp ON qa_runs(timestamp);
CREATE INDEX idx_qa_runs_status ON qa_runs(status);
CREATE INDEX idx_qa_runs_environment ON qa_runs(environment);
CREATE INDEX idx_qa_phases_run_id ON qa_phases(run_id);
CREATE INDEX idx_qa_phases_status ON qa_phases(status);
CREATE INDEX idx_qa_test_results_run_id ON qa_test_results(run_id);
CREATE INDEX idx_qa_test_results_status ON qa_test_results(status);
CREATE INDEX idx_qa_performance_metrics_run_id ON qa_performance_metrics(run_id);
CREATE INDEX idx_qa_security_scans_run_id ON qa_security_scans(run_id);
CREATE INDEX idx_qa_deployment_validations_run_id ON qa_deployment_validations(run_id);
CREATE INDEX idx_qa_monitoring_alerts_status ON qa_monitoring_alerts(status);
CREATE INDEX idx_qa_monitoring_alerts_severity ON qa_monitoring_alerts(severity);
CREATE INDEX idx_component_logs_timestamp ON component_logs(timestamp);
CREATE INDEX idx_component_logs_component ON component_logs(component_name);
CREATE INDEX idx_component_logs_level ON component_logs(log_level);
CREATE INDEX idx_component_logs_run_id ON component_logs(run_id);
CREATE INDEX idx_component_logs_correlation ON component_logs(correlation_id);
CREATE INDEX idx_deployment_events_type ON deployment_events(deployment_type);
CREATE INDEX idx_deployment_events_status ON deployment_events(deployment_status);
CREATE INDEX idx_deployment_events_timestamp ON deployment_events(start_time);
CREATE INDEX idx_api_health_timestamp ON api_health_logs(timestamp);
CREATE INDEX idx_api_health_endpoint ON api_health_logs(endpoint_name);
CREATE INDEX idx_api_health_run_id ON api_health_logs(run_id);
