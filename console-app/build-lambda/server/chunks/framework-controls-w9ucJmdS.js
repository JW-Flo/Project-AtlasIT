const FRAMEWORK_CONTROLS = {
  SOC2: [
    // CC1: Control Environment (5)
    {
      name: "CC1.1 - Oversight Responsibility",
      description: "The board of directors demonstrates independence from management and exercises oversight",
      automatable: false
    },
    {
      name: "CC1.2 - Authority and Responsibility",
      description: "Management establishes structures, reporting lines, and authority to support system objectives",
      automatable: false
    },
    {
      name: "CC1.3 - Integrity and Ethical Values",
      description: "Entity demonstrates commitment to integrity and ethical values through standards of conduct",
      automatable: false
    },
    {
      name: "CC1.4 - Competence",
      description: "Entity obtains or generates, uses, and maintains relevant, quality information for operating effectively",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "CC1.5 - Risk Appetite",
      description: "The board considers potential for fraud in evaluating risks to objectives",
      automatable: false
    },
    // CC2: Communication & Information (3)
    {
      name: "CC2.1 - Communication",
      description: "Entity communicates responsibility for system design and operation to internal stakeholders",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "CC2.2 - External Communication",
      description: "Entity communicates with external parties regarding matters affecting system design and operation",
      automatable: false
    },
    {
      name: "CC2.3 - Information Processing",
      description: "Entity obtains and maintains relevant quality information supporting the functioning of internal control",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    // CC3: Risk Assessment (4)
    {
      name: "CC3.1 - Risk Identification",
      description: "The entity specifies objectives with sufficient clarity to enable risk identification and assessment",
      automatable: false
    },
    {
      name: "CC3.2 - Risk Analysis",
      description: "Entity considers potential for fraud in assessing risks to the achievement of objectives",
      automatable: false
    },
    {
      name: "CC3.3 - Monitoring Changes",
      description: "Entity considers how changes could impact the system and objectives",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "CC3.4 - Change Impact",
      description: "Entity identifies, analyzes, and responds to changes that could significantly impact system objectives",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    // CC4: Monitoring Activities (2)
    {
      name: "CC4.1 - Ongoing Monitoring",
      description: "Entity selects, develops, and performs ongoing evaluations of internal control",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "CC4.2 - Findings and Corrections",
      description: "Entity monitors system activities and identifies findings needing corrective action",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    // CC5: Control Activities (3)
    {
      name: "CC5.1 - Control Activities Design",
      description: "Entity selects and develops control activities that contribute to mitigation of risks",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "CC5.2 - Segregation of Duties",
      description: "Entity also considers the potential for management override of controls",
      automatable: false
    },
    {
      name: "CC5.3 - Authorization Procedures",
      description: "The entity obtains or generates, uses and maintains relevant, quality information",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    // CC6: Logical & Physical Access (8)
    {
      name: "CC6.1 - Access Control",
      description: "Restrict logical and physical access to systems and data to authorized users",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "CC6.2 - Physical Facility Access",
      description: "Entity restricts physical access to facilities to authorized personnel",
      automatable: false
    },
    {
      name: "CC6.3 - Logical Access Control",
      description: "Entity restricts logical access to system functions and data to authorized users",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "CC6.4 - Logical Access Credentials",
      description: "Entity restricts access based on appropriate authorization and authentication procedures",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "CC6.5 - Logical Access Monitoring",
      description: "Entity monitors logical access to systems and data, detects unauthorized activity",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "CC6.6 - Access Control Review",
      description: "Entity reviews system access and user rights periodically",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "CC6.7 - Access Termination",
      description: "Entity promptly removes or disables logical access when authority expires",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "CC6.8 - Physical Security Incident Response",
      description: "Entity responds to physical security incidents appropriately",
      automatable: false
    },
    // CC7: System Operations (5)
    {
      name: "CC7.1 - System Configuration",
      description: "Entity implements systems to prevent or detect unauthorized transactions",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "CC7.2 - System Availability",
      description: "Entity ensures availability of information systems and underlying infrastructure",
      automatable: false
    },
    {
      name: "CC7.3 - Backup and Recovery",
      description: "Entity protects information systems and related assets through backup and recovery procedures",
      automatable: false
    },
    {
      name: "CC7.4 - Encryption and Key Management",
      description: "Entity uses encryption for data in transit and at rest, implements key management",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    {
      name: "CC7.5 - System Maintenance",
      description: "Entity maintains and supports system infrastructure to ensure continued operation",
      automatable: false
    },
    // CC8: Change Management (1)
    {
      name: "CC8.1 - Change Control Procedures",
      description: "Entity authorizes, designs, configures, implements, maintains, and monitors changes",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    // CC9: Risk Mitigation (2)
    {
      name: "CC9.1 - Business Continuity Planning",
      description: "Entity defines and implements business continuity and disaster recovery plans",
      automatable: false
    },
    {
      name: "CC9.2 - Third-Party Risk Management",
      description: "Entity assesses and monitors risks from third-party service providers",
      automatable: true,
      evaluationKey: "apps_connected"
    }
  ],
  ISO27001: [
    // A.5: Information Security Policies (2)
    {
      name: "A.5.1.1 - Information Security Policy Direction",
      description: "Set of information security policies to support organizational objectives and compliance",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "A.5.1.2 - Information Security Policy Review",
      description: "Review and update information security policies at planned intervals",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    // A.6: Organization of InfoSec (7)
    {
      name: "A.6.1.1 - Information Security Roles and Responsibilities",
      description: "Establish roles and responsibilities for information security management",
      automatable: false
    },
    {
      name: "A.6.1.2 - Information Security Coordination",
      description: "Coordinate information security across the organization",
      automatable: false
    },
    {
      name: "A.6.1.3 - Information Security Competence and Skills",
      description: "Ensure personnel have necessary competence and skills in information security",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "A.6.1.4 - Information Security Incident Responsibilities",
      description: "Define incident management responsibilities and escalation procedures",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "A.6.1.5 - Information Security Assessment",
      description: "Conduct regular assessments of information security compliance",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "A.6.2.1 - Third Party Agreements",
      description: "Include information security requirements in third-party agreements",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    {
      name: "A.6.2.2 - Supply Chain Information Security",
      description: "Manage information security in the supply chain",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    // A.7: HR Security (7)
    {
      name: "A.7.1.1 - Recruitment and Onboarding",
      description: "Ensure employees are vetted and trained in information security before access",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.7.1.2 - Terms and Conditions",
      description: "Information security responsibilities are documented in terms and conditions",
      automatable: false
    },
    {
      name: "A.7.2.1 - Management Responsibilities",
      description: "Management is responsible for enforcing information security policies",
      automatable: false
    },
    {
      name: "A.7.2.2 - Information Security Awareness",
      description: "All personnel receive information security awareness training",
      automatable: false
    },
    {
      name: "A.7.2.3 - Disciplinary Process",
      description: "Formal disciplinary process for information security policy violations",
      automatable: false
    },
    {
      name: "A.7.3.1 - Responsibilities After Employment",
      description: "After employment termination, information security responsibilities are managed",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    // A.8: Asset Management (8)
    {
      name: "A.8.1.1 - Asset Inventory",
      description: "Maintain an inventory of information assets with owners and classifications",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    {
      name: "A.8.1.2 - Asset Use Rights",
      description: "Assets are used in accordance with assigned use rights",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.8.1.3 - Asset Return Upon Termination",
      description: "All assets are returned or disposed of when employment ends",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "A.8.1.4 - Residual Information",
      description: "Information is removed or overwritten from media before reuse",
      automatable: false
    },
    {
      name: "A.8.2.1 - Classification Criteria",
      description: "Information is classified according to organizational criteria",
      automatable: false
    },
    {
      name: "A.8.2.2 - Information Labeling",
      description: "Information assets are appropriately labeled and classified",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "A.8.2.3 - Information Handling",
      description: "Information is handled in accordance with its classification",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "A.8.3.3 - Media Disposal",
      description: "Media is disposed of safely and securely when no longer needed",
      automatable: false
    },
    // A.9: Access Control (15)
    {
      name: "A.9.1.1 - Access Control Policy",
      description: "Establish and implement policy for access control to systems and data",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.9.2.1 - User Registration",
      description: "Formal procedures for user registration and access rights provisioning",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.9.2.2 - Privileged Access Rights",
      description: "Restrict and manage privileged access to systems and data",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.9.2.3 - User Access Review",
      description: "User access rights are reviewed periodically",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "A.9.2.4 - Access Rights Removal",
      description: "Remove or restrict access rights when no longer required",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.9.3.1 - User Password Management",
      description: "Implement password management policies to ensure secure authentication",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.9.4.1 - Restriction of Access",
      description: "Access to information processing facilities is restricted",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.9.4.2 - Secure Logon Procedures",
      description: "Access to systems through secure logon procedures is enforced",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.9.4.3 - Password Security",
      description: "Passwords meet strength requirements and are securely managed",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.9.4.4 - System Access and Use Monitoring",
      description: "System access and use is monitored and logged",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "A.9.4.5 - Access Control to Program Source Code",
      description: "Access to program source code is restricted and controlled",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    // A.10: Cryptography (2)
    {
      name: "A.10.1.1 - Encryption Policy",
      description: "A policy on use, protection, and expiry of cryptographic controls",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "A.10.1.2 - Cryptography Use",
      description: "Cryptography is used appropriately to protect information confidentiality and integrity",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    // A.11: Physical Security (9)
    {
      name: "A.11.1.1 - Physical Security Perimeter",
      description: "Physical perimeter controls prevent unauthorized access to facilities",
      automatable: false
    },
    {
      name: "A.11.1.2 - Physical Entry",
      description: "Physical access to facilities is restricted to authorized personnel",
      automatable: false
    },
    {
      name: "A.11.1.3 - Securing Offices and Facilities",
      description: "Offices and facilities containing information assets are secured",
      automatable: false
    },
    {
      name: "A.11.1.4 - Monitoring Physical Access",
      description: "Physical access to facilities is monitored and logged",
      automatable: false
    },
    {
      name: "A.11.1.5 - Power and Environmental Controls",
      description: "Power, water, air, and environmental controls are in place",
      automatable: false
    },
    {
      name: "A.11.2.1 - Equipment Security",
      description: "Equipment is positioned and protected to minimize risks",
      automatable: false
    },
    {
      name: "A.11.2.2 - Equipment Maintenance",
      description: "Equipment is maintained regularly to ensure continued operation",
      automatable: false
    },
    {
      name: "A.11.2.3 - Secure Disposal of Equipment",
      description: "Equipment is securely disposed of when no longer needed",
      automatable: false
    },
    {
      name: "A.11.2.9 - Cabling Security",
      description: "Power and telecommunications cabling is protected from interference",
      automatable: false
    },
    // A.12: Operations Security (8)
    {
      name: "A.12.1.1 - Operational Change Management",
      description: "Manage changes to systems to minimize impact on information security",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "A.12.1.2 - Segregation of Development and Production",
      description: "Separate development, testing, and production environments",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.12.2.1 - System Monitoring",
      description: "Monitor systems and information to detect anomalies and unauthorized activities",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "A.12.3.1 - Audit Logging",
      description: "Record user activities, access, and changes to systems",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "A.12.4.1 - Clock Synchronization",
      description: "System clocks are synchronized across the organization",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    {
      name: "A.12.5.1 - Malware Prevention",
      description: "Implement controls to prevent and detect malware",
      automatable: false
    },
    {
      name: "A.12.6.1 - Backup Management",
      description: "Backup data regularly and test recovery procedures",
      automatable: false
    },
    {
      name: "A.12.7.1 - Secure Development",
      description: "Information security is built into software development lifecycle",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    // A.13: Communications Security (4)
    {
      name: "A.13.1.1 - Network Segregation",
      description: "Networks and groups of information services are managed separately",
      automatable: false
    },
    {
      name: "A.13.1.3 - Network Access Control",
      description: "Access to network services is controlled",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "A.13.2.1 - Information Transfer Policies",
      description: "Information transfer procedures are controlled and secured",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "A.13.2.2 - Secure Data Transfer",
      description: "Data in transit is protected using encryption or other security controls",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    // A.14: System Acquisition (6)
    {
      name: "A.14.1.1 - Information Security Requirements",
      description: "Information security requirements are specified for systems and services",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "A.14.2.1 - Secure Development",
      description: "Development of systems follows secure development lifecycle practices",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "A.14.2.4 - Secure Development Testing",
      description: "Security testing is conducted before systems are deployed",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "A.14.3.1 - Acceptance Criteria",
      description: "Formal acceptance procedures are in place for systems before deployment",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    // A.16: Incident Management (7)
    {
      name: "A.16.1.1 - Incident Response Responsibilities",
      description: "Incident response responsibilities and procedures are defined",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "A.16.1.2 - Incident Reporting",
      description: "Incidents are reported promptly to appropriate parties",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "A.16.1.3 - Incident Assessment",
      description: "Incidents are assessed and validated",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "A.16.1.4 - Incident Response Activities",
      description: "Incident response activities are executed to contain and recover from incidents",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "A.16.1.5 - Incident Eradication",
      description: "Root causes of incidents are identified and eradicated",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "A.16.1.6 - Post-Incident Lessons",
      description: "Post-incident reviews are conducted to prevent recurrence",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "A.16.1.7 - Incident Evidence and Collection",
      description: "Evidence is preserved and handled appropriately during incident response",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    // A.18: Compliance (5)
    {
      name: "A.18.1.1 - Identification of Applicable Requirements",
      description: "Identify applicable legislative and regulatory requirements",
      automatable: false
    },
    {
      name: "A.18.1.2 - Information Security Compliance",
      description: "Organization complies with all applicable security requirements",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "A.18.1.3 - Assessment of Compliance",
      description: "Compliance with information security policies and standards is assessed",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "A.18.2.1 - Independent Review",
      description: "Information security performance is independently reviewed",
      automatable: false
    },
    {
      name: "A.18.2.3 - Compliance with Legal Obligations",
      description: "Organization complies with legal and regulatory obligations",
      automatable: true,
      evaluationKey: "policies_generated"
    }
  ],
  "NIST CSF": [
    // IDENTIFY (5)
    {
      name: "ID.AM - Asset Management",
      description: "Organization understands and documents systems, assets, and data to support risk assessment",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    {
      name: "ID.BE - Business Environment",
      description: "Organization understands business context and its mission-critical activities",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "ID.GV - Governance",
      description: "Governance structures support management and risk management",
      automatable: false
    },
    {
      name: "ID.RA - Risk Assessment",
      description: "Organization conducts risk assessments to understand likelihood and impact",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "ID.RM - Risk Management Strategy",
      description: "Organization establishes risk management strategy and approach",
      automatable: false
    },
    // PROTECT (7)
    {
      name: "PR.AC - Access Control",
      description: "Access to assets and data is limited based on need-to-know principles",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "PR.AT - Awareness and Training",
      description: "Personnel are trained on information security policies and procedures",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "PR.DS - Data Security",
      description: "Data is protected through appropriate controls and encryption",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    {
      name: "PR.IP - Information Protection Processes",
      description: "Security controls are implemented for systems and data",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "PR.MA - Maintenance",
      description: "Systems are maintained through patching and upgrades",
      automatable: false
    },
    {
      name: "PR.PT - Protective Technology",
      description: "Technical controls are implemented to protect systems and data",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "PR.SC - Supply Chain Risk Management",
      description: "Third-party risks are assessed and managed",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    // DETECT (3)
    {
      name: "DE.AE - Anomalies and Events",
      description: "Organizational systems detect and respond to anomalies and events",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "DE.CM - Continuous Monitoring",
      description: "Systems and data are continuously monitored for anomalies and unauthorized activity",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "DE.DP - Detection Processes",
      description: "Detection processes are defined, maintained, and reviewed",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    // RESPOND (4)
    {
      name: "RS.RP - Response Planning",
      description: "Response plan is prepared and communicated",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "RS.CO - Communications",
      description: "Incident information is coordinated and communicated",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "RS.AN - Analysis",
      description: "Incidents are analyzed to understand impact and determine response",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "RS.MI - Mitigation",
      description: "Activities are performed to prevent or stop incidents",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    // RECOVER (3)
    {
      name: "RC.RP - Recovery Planning",
      description: "Recovery plan is prepared and reviewed",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "RC.IM - Improvements",
      description: "Recovery activities are conducted and results are reviewed",
      automatable: false
    },
    {
      name: "RC.CO - Communications",
      description: "Restoration activities and associated communications are coordinated",
      automatable: true,
      evaluationKey: "workflows_configured"
    }
  ],
  HIPAA: [
    // Administrative Safeguards (7)
    {
      name: "164.308(a)(1) - Security Officer",
      description: "Designate a security officer responsible for developing and maintaining information security policies",
      automatable: false
    },
    {
      name: "164.308(a)(2) - Workforce Security",
      description: "Implement policies for managing workforce access to systems and data",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "164.308(a)(3) - Information Access Management",
      description: "Manage access based on role in the organization",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "164.308(a)(4) - Security Awareness Training",
      description: "Provide security awareness training to all workforce members",
      automatable: false
    },
    {
      name: "164.308(a)(5) - Security Incident Procedures",
      description: "Establish procedures for investigating and responding to security incidents",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "164.308(a)(7) - Contingency Planning",
      description: "Establish contingency plans for disaster recovery and business continuity",
      automatable: false
    },
    {
      name: "164.308(a)(8) - Evaluation",
      description: "Conduct periodic evaluations of information security effectiveness",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    // Physical Safeguards (3)
    {
      name: "164.310(a) - Facility Access Controls",
      description: "Implement measures to control physical access to facilities",
      automatable: false
    },
    {
      name: "164.310(b) - Workstation Use",
      description: "Define proper use of workstations and devices",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "164.310(d) - Device and Media Controls",
      description: "Implement controls for devices and media containing protected health information",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    // Technical Safeguards (5)
    {
      name: "164.312(a) - Access Controls",
      description: "Implement access control mechanisms to restrict unauthorized access",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "164.312(b) - Audit Controls",
      description: "Implement audit controls to record system activity",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "164.312(c) - Integrity",
      description: "Implement controls to ensure data integrity and prevent unauthorized modification",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    {
      name: "164.312(d) - Authentication",
      description: "Implement authentication procedures to verify user identity",
      automatable: true,
      evaluationKey: "directory_connected"
    },
    {
      name: "164.312(e) - Transmission Security",
      description: "Implement controls to protect data in transit",
      automatable: true,
      evaluationKey: "apps_connected"
    }
  ],
  GDPR: [
    // Data Protection Principles & Processing (3)
    {
      name: "Art.5 - Processing Principles",
      description: "Personal data is processed lawfully, fairly, transparently, and for legitimate purposes",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "Art.6 - Lawfulness of Processing",
      description: "Processing is based on legal basis such as consent, contract, or legal obligation",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "Art.9 - Special Categories of Data",
      description: "Special safeguards are applied when processing sensitive personal data",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    // Consent & Transparency (3)
    {
      name: "Art.7 - Consent",
      description: "Obtain and manage explicit, informed, and freely given consent",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "Art.12-14 - Transparency and Information",
      description: "Provide clear and transparent information about data processing",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    // Data Subject Rights (3)
    {
      name: "Art.15 - Right of Access",
      description: "Enable data subjects to access their personal data upon request",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "Art.17 - Right to Erasure",
      description: "Enable data subjects to request erasure of their personal data",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    {
      name: "Art.20 - Data Portability",
      description: "Enable data subjects to obtain and reuse their personal data",
      automatable: true,
      evaluationKey: "workflows_configured"
    },
    // Data Security & Privacy (3)
    {
      name: "Art.25 - Data Protection by Design",
      description: "Implement data protection measures in system design and processing",
      automatable: true,
      evaluationKey: "policies_generated"
    },
    {
      name: "Art.30 - Records of Processing",
      description: "Maintain records of all personal data processing activities",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    {
      name: "Art.32 - Security of Processing",
      description: "Implement appropriate technical and organizational security measures",
      automatable: true,
      evaluationKey: "apps_connected"
    },
    // Breach & Assessment (2)
    {
      name: "Art.33-34 - Breach Notification",
      description: "Notify authorities and data subjects of personal data breaches",
      automatable: true,
      evaluationKey: "incidents_configured"
    },
    {
      name: "Art.35 - Data Protection Impact Assessment",
      description: "Conduct DPIA for high-risk processing activities",
      automatable: false
    }
  ]
};
const CONTROL_TO_CDT_PREFIXES = {
  // SOC2
  soc2_cc1_1_oversight_responsibility: ["CC1.1"],
  soc2_cc1_2_authority_and_responsibility: ["CC1.2"],
  soc2_cc1_3_integrity_and_ethical_values: ["CC1.3"],
  soc2_cc1_4_competence: ["CC1.4"],
  soc2_cc1_5_risk_appetite: ["CC1.5"],
  soc2_cc2_1_communication: ["CC2.1"],
  soc2_cc2_2_external_communication: ["CC2.2"],
  soc2_cc2_3_information_processing: ["CC2.3"],
  soc2_cc3_1_risk_identification: ["CC3.1"],
  soc2_cc3_2_risk_analysis: ["CC3.2"],
  soc2_cc3_3_monitoring_changes: ["CC3.3"],
  soc2_cc3_4_change_impact: ["CC3.4"],
  soc2_cc4_1_ongoing_monitoring: ["CC4.1"],
  soc2_cc4_2_findings_and_corrections: ["CC4.2"],
  soc2_cc5_1_control_activities_design: ["CC5.1"],
  soc2_cc5_2_segregation_of_duties: ["CC5.2"],
  soc2_cc5_3_authorization_procedures: ["CC5.3"],
  soc2_cc6_1_access_control: ["CC6.1"],
  soc2_cc6_2_physical_facility_access: ["CC6.2"],
  soc2_cc6_3_logical_access_control: ["CC6.3"],
  soc2_cc6_4_logical_access_credentials: ["CC6.4"],
  soc2_cc6_5_logical_access_monitoring: ["CC6.5"],
  soc2_cc6_6_access_control_review: ["CC6.6"],
  soc2_cc6_7_access_termination: ["CC6.7"],
  soc2_cc6_8_physical_security_incident_response: ["CC6.8"],
  soc2_cc7_1_system_configuration: ["CC7.1"],
  soc2_cc7_2_system_availability: ["CC7.2"],
  soc2_cc7_3_backup_and_recovery: ["CC7.3"],
  soc2_cc7_4_encryption_and_key_management: ["CC7.4"],
  soc2_cc7_5_system_maintenance: ["CC7.5"],
  soc2_cc8_1_change_control_procedures: ["CC8.1"],
  soc2_cc9_1_business_continuity_planning: ["CC9.1"],
  soc2_cc9_2_third_party_risk_management: ["CC9.2"],
  // ISO27001
  iso27001_a_5_1_1_information_security_policy_direction: ["A.5.1.1"],
  iso27001_a_5_1_2_information_security_policy_review: ["A.5.1.2"],
  iso27001_a_6_1_1_information_security_roles_and_responsibilities: ["A.6.1.1"],
  iso27001_a_6_1_2_information_security_coordination: ["A.6.1.2"],
  iso27001_a_6_1_3_information_security_competence_and_skills: ["A.6.1.3"],
  iso27001_a_6_1_4_information_security_incident_responsibilities: ["A.6.1.4"],
  iso27001_a_6_1_5_information_security_assessment: ["A.6.1.5"],
  iso27001_a_6_2_1_third_party_agreements: ["A.6.2.1"],
  iso27001_a_6_2_2_supply_chain_information_security: ["A.6.2.2"],
  iso27001_a_7_1_1_recruitment_and_onboarding: ["A.7.1.1"],
  iso27001_a_7_1_2_terms_and_conditions: ["A.7.1.2"],
  iso27001_a_7_2_1_management_responsibilities: ["A.7.2.1"],
  iso27001_a_7_2_2_information_security_awareness: ["A.7.2.2"],
  iso27001_a_7_2_3_disciplinary_process: ["A.7.2.3"],
  iso27001_a_7_3_1_responsibilities_after_employment: ["A.7.3.1"],
  iso27001_a_8_1_1_asset_inventory: ["A.8.1.1"],
  iso27001_a_8_1_2_asset_use_rights: ["A.8.1.2"],
  iso27001_a_8_1_3_asset_return_upon_termination: ["A.8.1.3"],
  iso27001_a_8_1_4_residual_information: ["A.8.1.4"],
  iso27001_a_8_2_1_classification_criteria: ["A.8.2.1"],
  iso27001_a_8_2_2_information_labeling: ["A.8.2.2"],
  iso27001_a_8_2_3_information_handling: ["A.8.2.3"],
  iso27001_a_8_3_3_media_disposal: ["A.8.3.3"],
  iso27001_a_9_1_1_access_control_policy: ["A.9.1.1"],
  iso27001_a_9_2_1_user_registration: ["A.9.2.1"],
  iso27001_a_9_2_2_privileged_access_rights: ["A.9.2.2"],
  iso27001_a_9_2_3_user_access_review: ["A.9.2.3"],
  iso27001_a_9_2_4_access_rights_removal: ["A.9.2.4"],
  iso27001_a_9_3_1_user_password_management: ["A.9.3.1"],
  iso27001_a_9_4_1_restriction_of_access: ["A.9.4.1"],
  iso27001_a_9_4_2_secure_logon_procedures: ["A.9.4.2"],
  iso27001_a_9_4_3_password_security: ["A.9.4.3"],
  iso27001_a_9_4_4_system_access_and_use_monitoring: ["A.9.4.4"],
  iso27001_a_9_4_5_access_control_to_program_source_code: ["A.9.4.5"],
  iso27001_a_10_1_1_encryption_policy: ["A.10.1.1"],
  iso27001_a_10_1_2_cryptography_use: ["A.10.1.2"],
  iso27001_a_11_1_1_physical_security_perimeter: ["A.11.1.1"],
  iso27001_a_11_1_2_physical_entry: ["A.11.1.2"],
  iso27001_a_11_1_3_securing_offices_and_facilities: ["A.11.1.3"],
  iso27001_a_11_1_4_monitoring_physical_access: ["A.11.1.4"],
  iso27001_a_11_1_5_power_and_environmental_controls: ["A.11.1.5"],
  iso27001_a_11_2_1_equipment_security: ["A.11.2.1"],
  iso27001_a_11_2_2_equipment_maintenance: ["A.11.2.2"],
  iso27001_a_11_2_3_secure_disposal_of_equipment: ["A.11.2.3"],
  iso27001_a_11_2_9_cabling_security: ["A.11.2.9"],
  iso27001_a_12_1_1_operational_change_management: ["A.12.1.1"],
  iso27001_a_12_1_2_segregation_of_development_and_production: ["A.12.1.2"],
  iso27001_a_12_2_1_system_monitoring: ["A.12.2.1"],
  iso27001_a_12_3_1_audit_logging: ["A.12.3.1"],
  iso27001_a_12_4_1_clock_synchronization: ["A.12.4.1"],
  iso27001_a_12_5_1_malware_prevention: ["A.12.5.1"],
  iso27001_a_12_6_1_backup_management: ["A.12.6.1"],
  iso27001_a_12_7_1_secure_development: ["A.12.7.1"],
  iso27001_a_13_1_1_network_segregation: ["A.13.1.1"],
  iso27001_a_13_1_3_network_access_control: ["A.13.1.3"],
  iso27001_a_13_2_1_information_transfer_policies: ["A.13.2.1"],
  iso27001_a_13_2_2_secure_data_transfer: ["A.13.2.2"],
  iso27001_a_14_1_1_information_security_requirements: ["A.14.1.1"],
  iso27001_a_14_2_1_secure_development: ["A.14.2.1"],
  iso27001_a_14_2_4_secure_development_testing: ["A.14.2.4"],
  iso27001_a_14_3_1_acceptance_criteria: ["A.14.3.1"],
  iso27001_a_16_1_1_incident_response_responsibilities: ["A.16.1.1"],
  iso27001_a_16_1_2_incident_reporting: ["A.16.1.2"],
  iso27001_a_16_1_3_incident_assessment: ["A.16.1.3"],
  iso27001_a_16_1_4_incident_response_activities: ["A.16.1.4"],
  iso27001_a_16_1_5_incident_eradication: ["A.16.1.5"],
  iso27001_a_16_1_6_post_incident_lessons: ["A.16.1.6"],
  iso27001_a_16_1_7_incident_evidence_and_collection: ["A.16.1.7"],
  iso27001_a_18_1_1_identification_of_applicable_requirements: ["A.18.1.1"],
  iso27001_a_18_1_2_information_security_compliance: ["A.18.1.2"],
  iso27001_a_18_1_3_assessment_of_compliance: ["A.18.1.3"],
  iso27001_a_18_2_1_independent_review: ["A.18.2.1"],
  iso27001_a_18_2_3_compliance_with_legal_obligations: ["A.18.2.3"],
  // NIST CSF
  nist_csf_id_am_asset_management: ["ID.AM"],
  nist_csf_id_be_business_environment: ["ID.BE"],
  nist_csf_id_gv_governance: ["ID.GV"],
  nist_csf_id_ra_risk_assessment: ["ID.RA"],
  nist_csf_id_rm_risk_management_strategy: ["ID.RM"],
  nist_csf_pr_ac_access_control: ["PR.AC"],
  nist_csf_pr_at_awareness_and_training: ["PR.AT"],
  nist_csf_pr_ds_data_security: ["PR.DS"],
  nist_csf_pr_ip_information_protection_processes: ["PR.IP"],
  nist_csf_pr_ma_maintenance: ["PR.MA"],
  nist_csf_pr_pt_protective_technology: ["PR.PT"],
  nist_csf_pr_sc_supply_chain_risk_management: ["PR.SC"],
  nist_csf_de_ae_anomalies_and_events: ["DE.AE"],
  nist_csf_de_cm_continuous_monitoring: ["DE.CM"],
  nist_csf_de_dp_detection_processes: ["DE.DP"],
  nist_csf_rs_rp_response_planning: ["RS.RP"],
  nist_csf_rs_co_communications: ["RS.CO"],
  nist_csf_rs_an_analysis: ["RS.AN"],
  nist_csf_rs_mi_mitigation: ["RS.MI"],
  nist_csf_rc_rp_recovery_planning: ["RC.RP"],
  nist_csf_rc_im_improvements: ["RC.IM"],
  nist_csf_rc_co_communications: ["RC.CO"],
  // HIPAA
  hipaa_164_308_a_1_security_officer: ["164.308(a)(1)"],
  hipaa_164_308_a_2_workforce_security: ["164.308(a)(2)"],
  hipaa_164_308_a_3_information_access_management: ["164.308(a)(3)"],
  hipaa_164_308_a_4_security_awareness_training: ["164.308(a)(4)"],
  hipaa_164_308_a_5_security_incident_procedures: ["164.308(a)(5)"],
  hipaa_164_308_a_7_contingency_planning: ["164.308(a)(7)"],
  hipaa_164_308_a_8_evaluation: ["164.308(a)(8)"],
  hipaa_164_310_a_facility_access_controls: ["164.310(a)"],
  hipaa_164_310_b_workstation_use: ["164.310(b)"],
  hipaa_164_310_d_device_and_media_controls: ["164.310(d)"],
  hipaa_164_312_a_access_controls: ["164.312(a)"],
  hipaa_164_312_b_audit_controls: ["164.312(b)"],
  hipaa_164_312_c_integrity: ["164.312(c)"],
  hipaa_164_312_d_authentication: ["164.312(d)"],
  hipaa_164_312_e_transmission_security: ["164.312(e)"],
  // GDPR
  gdpr_art_5_processing_principles: ["Art.5"],
  gdpr_art_6_lawfulness_of_processing: ["Art.6"],
  gdpr_art_9_special_categories_of_data: ["Art.9"],
  gdpr_art_7_consent: ["Art.7"],
  gdpr_art_12_14_transparency_and_information: ["Art.12", "Art.13", "Art.14"],
  gdpr_art_15_right_of_access: ["Art.15"],
  gdpr_art_17_right_to_erasure: ["Art.17"],
  gdpr_art_20_data_portability: ["Art.20"],
  gdpr_art_25_data_protection_by_design: ["Art.25"],
  gdpr_art_30_records_of_processing: ["Art.30"],
  gdpr_art_32_security_of_processing: ["Art.32"],
  gdpr_art_33_34_breach_notification: ["Art.33", "Art.34"],
  gdpr_art_35_data_protection_impact_assessment: ["Art.35"]
};
function aggregateEvidenceForControls(cdtCounts) {
  const result = {};
  for (const [simplifiedId, prefixes] of Object.entries(CONTROL_TO_CDT_PREFIXES)) {
    let total = 0;
    for (const [cdtId, count] of Object.entries(cdtCounts)) {
      if (prefixes.some((p) => cdtId.startsWith(p))) {
        total += count;
      }
    }
    if (total > 0) result[simplifiedId] = total;
  }
  return result;
}
function buildDefaultControls(frameworks) {
  const controls = [];
  for (const fw of frameworks) {
    const defs = FRAMEWORK_CONTROLS[fw];
    if (!defs) continue;
    for (const def of defs) {
      controls.push({
        id: `${fw.toLowerCase().replace(/\s+/g, "_")}_${def.name.toLowerCase().replace(/[\s.,()\-]+/g, "_")}`.replace(/_+/g, "_").replace(/^_|_$/g, ""),
        framework: fw,
        name: def.name,
        description: def.description,
        status: "not_started",
        notes: "",
        automatable: def.automatable,
        evaluationKey: def.evaluationKey
      });
    }
  }
  return controls;
}

export { FRAMEWORK_CONTROLS as F, aggregateEvidenceForControls as a, buildDefaultControls as b };
//# sourceMappingURL=framework-controls-w9ucJmdS.js.map
