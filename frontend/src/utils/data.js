// Conversation trees and mock RAG data
export const conversationTrees = {
  license: {
    steps: [
      {
        copilot: "Sure! I can assist you with your driving license renewal. Please share your complete name, age, and your old license number. If you have document scans (old license card, medical certificate), drag them into the Document Center.",
        stepper: 0,
        stepDetail: "Intent classified: RENEW_LICENSE. Activating Motor Vehicle Act compliance RAG retrieval."
      },
      {
        copilot: "RAG fetched rulebook 'Motor Vehicle Act 2019'. Since your age is 42, a Medical Certificate (Form 1A) signed by a certified practitioner is required. I have pre-filled Form 9 (Driving License Renewal). Please upload your medical card and old license photo so OCR can verify them.",
        stepper: 1,
        stepDetail: "RAG search successful: DL guidelines retrieved. Verified criteria: age 42 requires Doctor signed Form 1A."
      },
      {
        copilot: "OCR scanning complete. Old license match found: DL-142019992 (Amit Sen). Medical certificate Form 1A verified: signed by Dr. K. Verma. Generating final digital application packet.",
        stepper: 2,
        stepDetail: "OCR verified uploads. License ID & Medical signoff signatures matches database ledger hashes."
      },
      {
        copilot: "Perfect! All fields compiled. I have packaged your documents and routed them to the West Delhi RTO administrative queue for officer approval. Tracking ID: TX-1002.",
        stepper: 3,
        stepDetail: "Application packaged. Forwarded packet to west-rto-queue."
      },
      {
        copilot: "Audit receipt created. Transaction logged into secure database register. Signature hash: 4f87c2...f982cfda. Your support chat is complete!",
        stepper: 4,
        stepDetail: "Cryptographic hash generated. Audit signature successfully registered."
      }
    ],
    formTitle: "Motor Vehicle Form 9 - License Renewal",
    emptyFields: [
      { label: "Applicant Name", value: "" },
      { label: "Date of Birth / Age", value: "" },
      { label: "Existing License Number", value: "" },
      { label: "Authority RTO Block", value: "" },
      { label: "Medical Verification Cert", value: "Awaiting Upload..." }
    ],
    filledFields: [
      { label: "Applicant Name", value: "Amit Sen" },
      { label: "Date of Birth / Age", value: "1984-06-12 / 42 Years" },
      { label: "Existing License Number", value: "DL-142019992" },
      { label: "Authority RTO Block", value: "West Delhi RTO" },
      { label: "Medical Verification Cert", value: "Form-1A (Verified Dr. K. Verma)" }
    ],
    txId: "TX-1002",
    dept: "Transport Desk",
    caseData: {
      id: "TX-1002", name: "Amit Sen", service: "Driving License Renewal",
      status: "Pending", language: "English",
      fields: {
        "Full Name": "Amit Sen", "Age": "42", "DL Number": "DL-142019992",
        "Office Authority": "West Delhi RTO", "Document Hashing": "sha256:d84f...c120",
        "Physical Verification": "Waived (OCR Confirmed)"
      },
      attachments: [
        { name: "DL_Card_Old.png", size: "245 KB", type: "Old License Image" },
        { name: "Med_Cert_Form1A.pdf", size: "1.2 MB", type: "Medical Fitness Cert" }
      ],
      summary: "Citizen requested fast-track renewal. Old card OCR confirmed."
    }
  },
  subsidy: {
    steps: [
      {
        copilot: "Understood. I can help submit crop damage compensation applications under the Disaster Relief Scheme. Please state your name, region, village block, and land register number (Khewat).",
        stepper: 0,
        stepDetail: "Intent parsed: CROP_DAMAGE_SUBSIDY. Activating state relief handbook RAG guidelines."
      },
      {
        copilot: "RAG guidelines loaded: 'State Disaster Response Fund (SDRF) 2026'. Eligibility: crop rain damage exceeds 50%. Pre-filling Punjab Disaster Relief Form.",
        stepper: 1,
        stepDetail: "RAG search successful. Active disaster relief code SDRF-26 loaded."
      },
      {
        copilot: "OCR parsing complete. Land document verified: Owner: Baldev Singh, Location: Punjab (Bilga Block), Khewat-45. Compiling relief grant sheet.",
        stepper: 2,
        stepDetail: "OCR matched files. Farmer name matched land register bounds. Rainfall stats: +65% flooding."
      },
      {
        copilot: "Subsidy application compiled. Queued to the Block Agricultural Officer's workspace. Tracking ID: TX-1481.",
        stepper: 3,
        stepDetail: "Packet queued. Forwarded to block-agri-officer-queue."
      },
      {
        copilot: "Receipt logged. Hashing code: 2a98f12a...e28cf9. Application closed successfully!",
        stepper: 4,
        stepDetail: "Audit record committed. Transaction registered."
      }
    ],
    formTitle: "Disaster Relief Grant - Crop Compensation Form",
    emptyFields: [
      { label: "Farmer Name", value: "" },
      { label: "State & Block", value: "" },
      { label: "Land Registry Khewat Number", value: "" },
      { label: "Total Holding Area", value: "" },
      { label: "Flood Damage Estimation", value: "Awaiting Field Inspection..." }
    ],
    filledFields: [
      { label: "Farmer Name", value: "Baldev Singh" },
      { label: "State & Block", value: "Punjab, Bilga Block" },
      { label: "Land Registry Khewat Number", value: "Khewat-45" },
      { label: "Total Holding Area", value: "4.2 Hectares" },
      { label: "Flood Damage Estimation", value: "+65% Area Flooded" }
    ],
    txId: "TX-1481",
    dept: "Agriculture Desk",
    caseData: {
      id: "TX-1481", name: "Baldev Singh", service: "Agricultural Crop Subsidy",
      status: "Pending", language: "Punjabi (ਪੰਜਾਬੀ)",
      fields: {
        "Farmer Name": "Baldev Singh", "Region / Block": "Punjab, Bilga Block",
        "Land Holding Size": "4.2 Hectares", "Register Number": "Khewat-45",
        "Damage Estimate": "Heavy Rainfall (+65% damage)"
      },
      attachments: [
        { name: "Punjab_Land_Record.pdf", size: "3.4 MB", type: "Land Registry Snapshot" }
      ],
      summary: "Farmer reported heavy flooding damage."
    }
  },
  birth: {
    steps: [
      {
        copilot: "Congratulations! I will assist in registering the child's birth. Please provide parent names, birth date, hospital name, and upload the maternity discharge summary.",
        stepper: 0,
        stepDetail: "Intent recognized: BIRTH_REGISTRATION. Activating Municipal Code registry search."
      },
      {
        copilot: "RAG registry search completed. Registration within 21 days is free of cost. Pre-filling Birth Registration Form 1.",
        stepper: 1,
        stepDetail: "RAG search matches: Municipal Code 1969. Registration timeline check: valid."
      },
      {
        copilot: "OCR reading done. Birth details: Date: July 3, 2026, Hospital: City General Maternity, Parents: S. Sharma & M. Sharma.",
        stepper: 2,
        stepDetail: "OCR confirmed hospital stamp. Parent profiles validated."
      },
      {
        copilot: "Form 1 compiled and submitted to Municipal Registrar queue. Tracking ID: TX-9052.",
        stepper: 3,
        stepDetail: "Forwarded registration to registrar-inbox."
      },
      {
        copilot: "Ledger commit finished. Verification hash: f4a2b910...82de. All set!",
        stepper: 4,
        stepDetail: "Audit complete. Cryptographic registration hash written."
      }
    ],
    formTitle: "Form 1 - Municipal Birth Certificate Request",
    emptyFields: [
      { label: "Name of Child", value: "" },
      { label: "Date of Birth", value: "" },
      { label: "Place of Birth", value: "" },
      { label: "Father Name", value: "" },
      { label: "Hospital Verification Hash", value: "Awaiting Upload..." }
    ],
    filledFields: [
      { label: "Name of Child", value: "Baby Girl of S. Sharma" },
      { label: "Date of Birth", value: "2026-07-03" },
      { label: "Place of Birth", value: "City General Maternity Hospital" },
      { label: "Father Name", value: "Suresh Sharma" },
      { label: "Hospital Verification Hash", value: "Verified discharge-cert-492" }
    ],
    txId: "TX-9052",
    dept: "Municipal Desk",
    caseData: {
      id: "TX-9052", name: "Suresh Sharma", service: "Birth Registration",
      status: "Pending", language: "Hindi (हिन्दी)",
      fields: {
        "Child Name": "Baby Girl of S. Sharma", "Date of Birth": "2026-07-03",
        "Place of Birth": "City General Maternity Hospital",
        "Father Name": "Suresh Sharma", "Mother Name": "Meena Sharma"
      },
      attachments: [
        { name: "Hospital_Discharge_Summary.pdf", size: "980 KB", type: "Discharge sheet" }
      ],
      summary: "Maternity document hospital stamp matches."
    }
  },
  death: {
    steps: [
      {
        copilot: "I will assist you in registering a death certificate request. Please share the deceased person's name, date of demise, place of occurrence, and age. Also upload the official hospital death summary or medical report.",
        stepper: 0,
        stepDetail: "Intent parsed: DEATH_REGISTRATION. Activating Municipal Death Registry guidelines."
      },
      {
        copilot: "RAG fetched Guidelines 'Registrar General of Births & Deaths Act'. Registrations within 21 days are free of cost. Pre-filling Municipal Death Register Form 2.",
        stepper: 1,
        stepDetail: "RAG search successful. Active regulatory compliance: 21-day timeline validated."
      },
      {
        copilot: "OCR parsing completed. Demised Person: Ramesh Kumar. Date of Demise: 2026-06-28. Hospital: District Civil Hospital. Verified medical certification of cause.",
        stepper: 2,
        stepDetail: "OCR verified deceased record, hospital stamp, and doctor's signature."
      },
      {
        copilot: "Death registration packet compiled and routed to the Municipal Registrar Division. Tracking ID: TX-4491.",
        stepper: 3,
        stepDetail: "Packet queued. Forwarded request to municipal-registrar-division."
      },
      {
        copilot: "Audit receipt created. Ledger registered. Signature hash: 7e2b10f2...33b9ef. Registration workflow completed.",
        stepper: 4,
        stepDetail: "Audit record committed. Secure registry database hash updated."
      }
    ],
    formTitle: "Form 2 - Municipal Death Certificate Request",
    emptyFields: [
      { label: "Deceased Full Name", value: "" },
      { label: "Date of Demise", value: "" },
      { label: "Place of Demise", value: "" },
      { label: "Age / Gender", value: "" },
      { label: "Hospital Demise Certificate Hash", value: "Awaiting Upload..." }
    ],
    filledFields: [
      { label: "Deceased Full Name", value: "Ramesh Kumar" },
      { label: "Date of Demise", value: "2026-06-28" },
      { label: "Place of Demise", value: "District Civil Hospital" },
      { label: "Age / Gender", value: "72 Years / Male" },
      { label: "Hospital Demise Certificate Hash", value: "Verified cause-cert-7104" }
    ],
    txId: "TX-4491",
    dept: "Municipal Desk",
    caseData: {
      id: "TX-4491", name: "Sunil Kumar", service: "Death Registration",
      status: "Pending", language: "Hindi (हिन्दी)",
      fields: {
        "Deceased Name": "Ramesh Kumar", "Date of Demise": "2026-06-28",
        "Place of Death": "District Civil Hospital", "Age at Demise": "72",
        "Informant Name": "Sunil Kumar", "Relation": "Son"
      },
      attachments: [
        { name: "Hospital_Demise_Summary.pdf", size: "1.1 MB", type: "Medical Cause Certificate" }
      ],
      summary: "Deceased demographic record matched. Hospital registry verified."
    }
  },
  rythu: {
    steps: [
      {
        copilot: "Greetings! Let's initialize your Rythu Bandhu Farmer Investment Support application. Please share your farmer passbook number (Pattadar ID), region/village block, total farming land size, and upload your land Pattadar passbook document.",
        stepper: 0,
        stepDetail: "Intent parsed: RYTHU_BANDHU_SUPPORT. Retrieving Telangana Land Records database RAG guidelines."
      },
      {
        copilot: "RAG guidelines fetched: 'Rythu Bandhu Investment Support Rules'. Eligible support: ₹5,000 per acre per season for Pattadar landholders. Pre-filling Agriculture investment form.",
        stepper: 1,
        stepDetail: "RAG lookup successful. Agri Support rate ₹5,000/acre loaded."
      },
      {
        copilot: "OCR scanning finished. Pattadar ID: TS-RYTHU-88219 (K. Srinivasa Rao). Location: Khammam District. Total Area: 3.5 Acres. Compiling relief grant sheet.",
        stepper: 2,
        stepDetail: "OCR verified pattadar registry signature. Land ownership size 3.5 acres confirmed."
      },
      {
        copilot: "Rythu Bandhu support application compiled. Routed to the Block Agricultural Development Officer. Tracking ID: TX-7104.",
        stepper: 3,
        stepDetail: "Application packaged. Forwarded packet to block-agri-officer-queue."
      },
      {
        copilot: "Ledger entry updated. Transaction registered with hash: 88ba2e9d...a924b1. Your application is safely logged.",
        stepper: 4,
        stepDetail: "Cryptographic hash generated. Secure registry database hash updated."
      }
    ],
    formTitle: "Rythu Bandhu - Pattadar Investment Support Form",
    emptyFields: [
      { label: "Farmer Full Name", value: "" },
      { label: "Pattadar Passbook Number", value: "" },
      { label: "Land Holding Size (Acres)", value: "" },
      { label: "District & Mandal", value: "" },
      { label: "Bank Account Details", value: "Awaiting Land Registry Sync..." }
    ],
    filledFields: [
      { label: "Farmer Full Name", value: "K. Srinivasa Rao" },
      { label: "Pattadar Passbook Number", value: "TS-RYTHU-88219" },
      { label: "Land Holding Size (Acres)", value: "3.5 Acres" },
      { label: "District & Mandal", value: "Khammam, Kallur Mandal" },
      { label: "Bank Account Details", value: "SBI Kallur (Acc: ******9821)" }
    ],
    txId: "TX-7104",
    dept: "Agriculture Desk",
    caseData: {
      id: "TX-7104", name: "K. Srinivasa Rao", service: "Rythu Bandhu Scheme",
      status: "Pending", language: "Telugu (తెలుగు)",
      fields: {
        "Farmer Name": "K. Srinivasa Rao", "Pattadar ID": "TS-RYTHU-88219",
        "Land Size": "3.5 Acres", "Investment Support Amount": "₹17,500",
        "District / Mandal": "Khammam, Kallur Mandal", "Linked Aadhaar": "******2894"
      },
      attachments: [
        { name: "Pattadar_Passbook_Scan.pdf", size: "2.8 MB", type: "Land Ownership Book" }
      ],
      summary: "Farmer verified with Khammam land records. Support amount calculated at ₹17,500."
    }
  },
  aadhaar: {
    steps: [
      {
        copilot: "Sure! Let's update your Aadhaar details. Please state the fields you want to update (e.g. Address, Phone, Name) and provide your 12-digit Aadhaar number. Please upload your supporting identity or address proof documents (Passport, Rent Agreement, Utility Bill).",
        stepper: 0,
        stepDetail: "Intent parsed: AADHAAR_UPDATE. Checking UIDAI verification rulebook via RAG."
      },
      {
        copilot: "RAG fetched rulebook 'UIDAI Aadhaar Update Guidelines'. Updates to address require proof of residence (PoA). Online updates process in 5–7 working days. Pre-filling Aadhaar correction form.",
        stepper: 1,
        stepDetail: "RAG search successful. Active UIDAI PoA acceptable document list loaded."
      },
      {
        copilot: "OCR scanning complete. Address proof verified: Electricity Bill (BSES Yamuna). New Address: H-43, Sector 15, Rohini, Delhi. Aadhaar match found for: Ananya Sharma.",
        stepper: 2,
        stepDetail: "OCR verified applicant name match in bs-utility-bill and UIDAI central record."
      },
      {
        copilot: "Aadhaar correction packet formatted and routed to the UIDAI Verification Desk. Tracking ID: TX-8821.",
        stepper: 3,
        stepDetail: "Aadhaar update packet compiled. Sent to UIDAI registrar queue."
      },
      {
        copilot: "Audit trail recorded. Ledger entry logged. Signature hash: a02f392b...dd99ef. Aadhaar update workflow finished.",
        stepper: 4,
        stepDetail: "Cryptographic hash generated. Secure registry database hash updated."
      }
    ],
    formTitle: "UIDAI Form - Aadhaar Details Update",
    emptyFields: [
      { label: "Aadhaar Card Number", value: "" },
      { label: "Applicant Name", value: "" },
      { label: "Update Type Required", value: "" },
      { label: "Proposed New Value", value: "" },
      { label: "Proof of Address/Identity File", value: "Awaiting Upload..." }
    ],
    filledFields: [
      { label: "Aadhaar Card Number", value: "3298 4810 9924" },
      { label: "Applicant Name", value: "Ananya Sharma" },
      { label: "Update Type Required", value: "Address Update" },
      { label: "Proposed New Value", value: "H-43, Sector 15, Rohini, Delhi" },
      { label: "Proof of Address/Identity File", value: "Electricity_Bill_BSES.pdf (Verified)" }
    ],
    txId: "TX-8821",
    dept: "UIDAI Desk",
    caseData: {
      id: "TX-8821", name: "Ananya Sharma", service: "Aadhaar Details Update",
      status: "Pending", language: "English",
      fields: {
        "Aadhaar Number": "3298 4810 9924", "Full Name": "Ananya Sharma",
        "Update Selected": "Address Change", "New Address": "H-43, Sector 15, Rohini, Delhi",
        "Proof Submitted": "Electricity BSES Bill", "OCR Verification": "Passed (Match 100%)"
      },
      attachments: [
        { name: "Electricity_Bill_BSES.pdf", size: "780 KB", type: "Utility Bill Address Proof" }
      ],
      summary: "Applicant requests address correction. Utility bill OCR verifies new residence address."
    }
  },
  pan: {
    steps: [
      {
        copilot: "Sure, let's start your new PAN (Permanent Account Number) application. Please state your name, date of birth, father's name, and Aadhaar number. Upload a scan of your Aadhaar card as proof of identity and age.",
        stepper: 0,
        stepDetail: "Intent parsed: PAN_APPLICATION. Loading Income Tax Department Form 49A guidelines."
      },
      {
        copilot: "RAG fetched rulebook 'Income Tax Department rules - Form 49A'. PAN processing requires Aadhaar e-KYC validation. Pre-filling Form 49A.",
        stepper: 1,
        stepDetail: "RAG search successful. Active compliance checks loaded: Aadhaar PoI/PoA rules."
      },
      {
        copilot: "OCR check completed. Aadhaar details scanned: Name: Rajesh Patel, DoB: 1991-03-24, Aadhaar: **** **** 1092. UIDAI database query returned positive e-KYC handshake.",
        stepper: 2,
        stepDetail: "OCR verified Aadhaar snapshot match. Central e-KYC response: Success."
      },
      {
        copilot: "Form 49A details compiled and routed to the NSDL/UTIITSL processing center. Tracking ID: TX-1194.",
        stepper: 3,
        stepDetail: "PAN request packet submitted. Routed to NSDL database queue."
      },
      {
        copilot: "Ledger transaction updated. Verification hash: b93a8d10...228cfda. PAN workflow completed.",
        stepper: 4,
        stepDetail: "Cryptographic hash generated. Audit signature successfully registered."
      }
    ],
    formTitle: "ITD Form 49A - New PAN Card Application",
    emptyFields: [
      { label: "Applicant Full Name", value: "" },
      { label: "Father Name", value: "" },
      { label: "Date of Birth", value: "" },
      { label: "Aadhaar Card Number", value: "" },
      { label: "Signature / Thumb Impression", value: "Awaiting Verification..." }
    ],
    filledFields: [
      { label: "Applicant Full Name", value: "Rajesh Patel" },
      { label: "Father Name", value: "Harish Patel" },
      { label: "Date of Birth", value: "1991-03-24" },
      { label: "Aadhaar Card Number", value: "8821 1904 1092" },
      { label: "Signature / Thumb Impression", value: "Aadhaar e-Sign Verified" }
    ],
    txId: "TX-1194",
    dept: "Revenue Desk",
    caseData: {
      id: "TX-1194", name: "Rajesh Patel", service: "PAN Card Application",
      status: "Pending", language: "Gujarati (ગુજરાતી)",
      fields: {
        "Full Name": "Rajesh Patel", "Father Name": "Harish Patel",
        "Date of Birth": "1991-03-24", "Aadhaar Card Linked": "8821 1904 1092",
        "Category": "Individual", "Verification Protocol": "NSDL Aadhaar e-Sign"
      },
      attachments: [
        { name: "Aadhaar_Card_Front_Scan.png", size: "410 KB", type: "Proof of Identity" }
      ],
      summary: "Applicant submitted NSDL Form 49A request. Identity matching with Aadhaar database completed."
    }
  },
  income: {
    steps: [
      {
        copilot: "Greetings! Let's start your Annual Income Certificate application. Please state your full name, father's/spouse's name, region, purpose of certificate, and source of income. Please upload your salary slips or bank statements.",
        stepper: 0,
        stepDetail: "Intent parsed: INCOME_CERTIFICATE. Loading revenue board circulars."
      },
      {
        copilot: "RAG fetched rulebook 'Revenue Board Income Assessment'. Income certificates process in 15 days. Pre-filling Revenue Form 12.",
        stepper: 1,
        stepDetail: "RAG lookup successful. Active revenue rules and local taxation limits loaded."
      },
      {
        copilot: "OCR scanning complete. Bank Statement analyzed: Monthly credits average ₹25,000. Annual estimated income: ₹3,00,000. Applicant: Meera Bai.",
        stepper: 2,
        stepDetail: "OCR verified income slip records and average credit balances."
      },
      {
        copilot: "Form 12 details compiled and routed to the Local Revenue Inspector (Tehsildar) desk. Tracking ID: TX-5510.",
        stepper: 3,
        stepDetail: "Application compiled. Forwarded packet to tehsildar-desk."
      },
      {
        copilot: "Receipt logged. Cryptographic signature generated: a92b210f...f9948e. Your application is saved.",
        stepper: 4,
        stepDetail: "Cryptographic hash generated. Audit signature successfully registered."
      }
    ],
    formTitle: "Revenue Form 12 - Income Certificate Application",
    emptyFields: [
      { label: "Applicant Name", value: "" },
      { label: "Father/Spouse Name", value: "" },
      { label: "District, Mandal & Village", value: "" },
      { label: "Reported Annual Income (Rs)", value: "" },
      { label: "Income Proof Document", value: "Awaiting Upload..." }
    ],
    filledFields: [
      { label: "Applicant Name", value: "Meera Bai" },
      { label: "Father/Spouse Name", value: "Ram Lal" },
      { label: "District, Mandal & Village", value: "Rajasthan, Jaipur Rural" },
      { label: "Reported Annual Income (Rs)", value: "Rs 3,00,000/-" },
      { label: "Income Proof Document", value: "Bank_Statement_6M.pdf (Verified)" }
    ],
    txId: "TX-5510",
    dept: "Revenue Desk",
    caseData: {
      id: "TX-5510", name: "Meera Bai", service: "Income Certificate",
      status: "Pending", language: "Hindi (हिन्दी)",
      fields: {
        "Applicant Name": "Meera Bai", "Father/Husband Name": "Ram Lal",
        "District / Block": "Rajasthan, Jaipur Rural", "Annual Family Income": "₹3,00,000",
        "Purpose": "Higher Education Fee Waiver"
      },
      attachments: [
        { name: "Bank_Statement_6M.pdf", size: "1.8 MB", type: "6 Months Bank Statement" }
      ],
      summary: "Income check completed. Credits average matches family declaration."
    }
  },
  caste: {
    steps: [
      {
        copilot: "Greetings! I will assist you in applying for a Caste Certificate (SC/ST/OBC/EWS). Please state your name, father's name, caste category, sub-caste, and location block. Please upload your ancestor's caste proof (caste cert of father/brother or school records).",
        stepper: 0,
        stepDetail: "Intent parsed: CASTE_CERTIFICATE. Retrieving state social welfare database check."
      },
      {
        copilot: "RAG fetched rulebook 'Social Welfare Caste Verification Rules'. OBC updates require creamy layer proof. Pre-filling State Caste Certificate Form 4.",
        stepper: 1,
        stepDetail: "RAG lookup successful. Caste hierarchy classification guidelines loaded."
      },
      {
        copilot: "OCR scan complete. Father's old caste certificate verified: Class OBC (Sub-caste: Yadav). Applicant: Vikranth Yadav. Region: Bihar, Patna Block.",
        stepper: 2,
        stepDetail: "OCR verified old certificate registrar seal and Yadav sub-caste lineage."
      },
      {
        copilot: "Form 4 details compiled and routed to the Block Development Officer (BDO) queue. Tracking ID: TX-6629.",
        stepper: 3,
        stepDetail: "Caste verification packet compiled. Sent to BDO queue."
      },
      {
        copilot: "Audit receipt logged. Signature hash: e02b4fa1...892ccfda. Your caste verification process is initiated.",
        stepper: 4,
        stepDetail: "Cryptographic hash generated. Audit signature successfully registered."
      }
    ],
    formTitle: "Form 4 - State Caste Certificate Application",
    emptyFields: [
      { label: "Applicant Name", value: "" },
      { label: "Father Name", value: "" },
      { label: "Category SC/ST/OBC/EWS", value: "" },
      { label: "Sub-Caste Name", value: "" },
      { label: "Ancestral Caste Certificate Proof", value: "Awaiting Upload..." }
    ],
    filledFields: [
      { label: "Applicant Name", value: "Vikranth Yadav" },
      { label: "Father Name", value: "Kailash Yadav" },
      { label: "Category SC/ST/OBC/EWS", value: "OBC" },
      { label: "Sub-Caste Name", value: "Yadav" },
      { label: "Ancestral Caste Certificate Proof", value: "Father_Caste_Cert_1992.pdf (Verified)" }
    ],
    txId: "TX-6629",
    dept: "Social Welfare Desk",
    caseData: {
      id: "TX-6629", name: "Vikranth Yadav", service: "Caste Certificate",
      status: "Pending", language: "Hindi (हिन्दी)",
      fields: {
        "Applicant Name": "Vikranth Yadav", "Father Name": "Kailash Yadav",
        "Category Requested": "OBC", "Sub-Caste": "Yadav",
        "Address Block": "Patna Sadar, Bihar"
      },
      attachments: [
        { name: "Father_Caste_Cert_1992.pdf", size: "1.5 MB", type: "Father's Caste Certificate" }
      ],
      summary: "Ancestral certificate seal is match. Family Yadav sub-caste confirmed."
    }
  }
};

export const mockRAGRules = [
  { title: "Motor Vehicles Act Section 15 - License Renewal Rules", text: "If an applicant exceeds the age of 40 years, every application for a driving license renewal MUST be accompanied by a medical certificate (Form 1A) declaring physical fitness signed by a registered medical practitioner." },
  { title: "Disaster Crop Relief Scheme Circular 41", text: "Compensation grants under the crop disaster relief scheme are eligible for farmers whose localized crop damage estimate exceeds 50% due to rain, flooding, or wind hazards, as confirmed by block surveys." },
  { title: "Municipal Registration Code 1969 Clause 8 (Births)", text: "All births occurring in state maternity hospitals must be registered within 21 days from the date of delivery. Birth registrations made within this timeframe do not incur processing charges." },
  { title: "Municipal Registration Code 1969 Clause 12 (Deaths)", text: "All demises must be registered under municipal records within 21 days. Demises registered after 21 days require a Magistrate order and lateness fees." },
  { title: "Telangana Rythu Bandhu Scheme Order 104", text: "Rythu Bandhu investment support is paid at ₹5,000 per acre per crop season directly via DBT. Eligibility is restricted to landholding Pattadars registered in Dharani database." },
  { title: "UIDAI Aadhaar Data Update Regulations 2024", text: "Updates to Aadhaar demographic fields require verified proof documents: Passport, Driving License, Voter Card, or BSES utility bills. Mobile verification must complete via OTP." },
  { title: "Income Tax Department Section 139A - PAN Card Rules", text: "An individual applying for a Permanent Account Number (PAN) must provide Aadhaar Card as proof of identity, proof of address, and proof of age. Mismatch in Aadhaar name will trigger rejection." },
  { title: "Right to Public Services Act Section 3", text: "Every citizen has the right to receive designated public services within the stipulated time frame. Failure by the designated officer to provide the service within time shall be considered a ground for penalty." },
  { title: "Aadhaar Authentication Guidelines 2024", text: "Government departments may use Aadhaar-based e-KYC for instant verification of citizen identity. The process requires explicit consent from the applicant and must comply with data protection norms." }
];

export const initialApplications = [
  {
    id: "TX-1002", name: "Amit Sen", service: "Driving License Renewal",
    timestamp: "2026-07-04 11:20:15", status: "Pending", language: "English",
    fields: {
      "Full Name": "Amit Sen", "Age": "42", "DL Number": "DL-142019992",
      "Office Authority": "West Delhi RTO", "Document Hashing": "sha256:d84f...c120",
      "Physical Verification": "Waived (OCR Confirmed)"
    },
    attachments: [
      { name: "DL_Card_Old.png", size: "245 KB", type: "Old License Image" },
      { name: "Med_Cert_Form1A.pdf", size: "1.2 MB", type: "Medical Fitness Cert" }
    ],
    summary: "Citizen requested fast-track renewal. Old card OCR confirmed."
  },
  {
    id: "TX-1481", name: "Baldev Singh", service: "Agricultural Crop Subsidy",
    timestamp: "2026-07-04 12:45:00", status: "Pending", language: "Punjabi (ਪੰਜਾਬੀ)",
    fields: {
      "Farmer Name": "Baldev Singh", "Region / Block": "Punjab, Bilga Block",
      "Land Holding Size": "4.2 Hectares", "Register Number": "Khewat-45",
      "Damage Estimate": "Heavy Rainfall (+65% damage)"
    },
    attachments: [
      { name: "Punjab_Land_Record.pdf", size: "3.4 MB", type: "Land Registry Snapshot" }
    ],
    summary: "Farmer reported heavy flooding damage."
  },
  {
    id: "TX-7104", name: "K. Srinivasa Rao", service: "Rythu Bandhu Scheme",
    timestamp: "2026-07-04 14:10:02", status: "Pending", language: "Telugu (తెలుగు)",
    fields: {
      "Farmer Name": "K. Srinivasa Rao", "Pattadar ID": "TS-RYTHU-88219",
      "Land Size": "3.5 Acres", "Investment Support Amount": "₹17,500",
      "District / Mandal": "Khammam, Kallur Mandal"
    },
    attachments: [
      { name: "Pattadar_Passbook_Scan.pdf", size: "2.8 MB", type: "Land Ownership Book" }
    ],
    summary: "Farmer verified with Khammam land records. Support amount calculated at ₹17,500."
  },
  {
    id: "TX-8821", name: "Ananya Sharma", service: "Aadhaar Details Update",
    timestamp: "2026-07-04 15:30:11", status: "Pending", language: "English",
    fields: {
      "Aadhaar Number": "3298 4810 9924", "Full Name": "Ananya Sharma",
      "Update Selected": "Address Change", "New Address": "H-43, Sector 15, Rohini, Delhi"
    },
    attachments: [
      { name: "Electricity_Bill_BSES.pdf", size: "780 KB", type: "Utility Bill Address Proof" }
    ],
    summary: "Applicant requests address correction. Utility bill OCR verifies new residence address."
  }
];

export const initialLedger = [
  { timestamp: "2026-07-04 11:15:02", txId: "TX-1002", event: "Intent Clarified: RENEW_LICENSE", dept: "Transport Desk", hash: "4f87c2e0a2b8e391b490f238d748f29e" },
  { timestamp: "2026-07-04 11:15:10", txId: "TX-1002", event: "RAG Fetch: Motor Vehicle Act 2019", dept: "Legal Database", hash: "e29d3810ff42be247b9c9f2847a9de12" },
  { timestamp: "2026-07-04 11:18:24", txId: "TX-1002", event: "OCR Scan: Med_Cert_Form1A.pdf", dept: "Verification System", hash: "8d9f10a2eb3e48e2348b9c2a4f9d48e5" },
  { timestamp: "2026-07-04 11:20:15", txId: "TX-1002", event: "Application Queued: Amit Sen", dept: "Transport Desk", hash: "bf29d81d7bc23a8e9d34208be128fb9a" },
  { timestamp: "2026-07-04 12:40:01", txId: "TX-1481", event: "Intent Clarified: AGRI_SUBSIDY", dept: "Agriculture Desk", hash: "2a98f12a3d0fbc28ed34b92c4f8d9a10" },
  { timestamp: "2026-07-04 12:45:00", txId: "TX-1481", event: "Application Queued: Baldev Singh", dept: "Agriculture Desk", hash: "dfa83d29cb1f2389d38402bc1209bca3" },
  { timestamp: "2026-07-04 14:05:12", txId: "TX-7104", event: "Intent Clarified: RYTHU_BANDHU", dept: "Agriculture Desk", hash: "88ba2e9dfa3382901b0f19ce928d3ba1" },
  { timestamp: "2026-07-04 14:10:02", txId: "TX-7104", event: "Application Queued: K. Srinivasa Rao", dept: "Agriculture Desk", hash: "e23fa8b10f2dcf3498a9e01dbcdff9a2" },
  { timestamp: "2026-07-04 15:25:31", txId: "TX-8821", event: "Intent Clarified: AADHAAR_UPDATE", dept: "UIDAI Desk", hash: "a02f392bdd99eff382a93dfdca91cda2" },
  { timestamp: "2026-07-04 15:30:11", txId: "TX-8821", event: "Application Queued: Ananya Sharma", dept: "UIDAI Desk", hash: "ff29dc0aef2b39dc1d84a92c3ff2e8c2" }
];

export function generateHash(text) {
  let hash = '';
  for (let i = 0; i < 32; i++) {
    let code = (text.charCodeAt(i % text.length) * (i + 7)) % 16;
    hash += code.toString(16);
  }
  return hash;
}
