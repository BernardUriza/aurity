# AURITY Framework
## Artificial United Robust Intelligence for Telemedicine Yield

**Sprint:** SPR-2025W44 (2025-10-27 a 2025-11-10)
**Version:** 0.1.0-alpha
**Status:** 🚧 In Development

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Sprint Restrictions](#sprint-restrictions)
- [Module Status](#module-status)
- [Contributing](#contributing)
- [Security](#security)

---

## 🎯 Overview

Aurity es un framework de telemedicina edge-first que integra **Free Intelligence (FI)** como sistema nervioso técnico local, proporcionando memoria clínica verificable sin dependencia de nubes opacas.

### Key Principles

🔐 **Data Sovereignty** - La información sensible nunca sale del perímetro controlado
🏥 **On-Premise First** - Cloud when necessary, HIPAA-compliant by design
🔍 **Verifiable Memory** - Integridad criptográfica en todos los datos clínicos
⚡ **Progressive Enhancement** - From simple IoT to full clinical AI

### Core Flow

```
ESP32 Wearable → Mobile App → NAS (Free Intelligence) → Optional Cloud Services
```

---

## 🏗️ Architecture

### High-Level Components

```
┌─────────────────────────────────────────────┐
│            NAS Synology DS923+              │
│  ┌───────────────────────────────────────┐  │
│  │     Free Intelligence Core            │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │   Ingestion Layer               │  │  │
│  │  │   Validation Layer              │  │  │
│  │  │   Processing Layer (Optional)   │  │  │
│  │  │   Governance Layer              │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │         Storage Layer                 │  │
│  │  - PostgreSQL (metadata)              │  │
│  │  - MinIO (objects)                    │  │
│  │  - Qdrant (embeddings)                │  │
│  │  - TimescaleDB (metrics)              │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
aurity/
├── core/                    # Free Intelligence Core components
│   ├── ingestion/          # Multi-format data capture
│   ├── validation/         # Cryptographic integrity
│   ├── processing/         # AI/ML pipelines
│   ├── governance/         # RBAC, retention, audit
│   └── storage/            # Data persistence layer
│
├── modules/                # Feature modules by phase
│   ├── fi-cold/           # [Phase 1] Cadena de frío biomédica
│   ├── fi-entry/          # [Phase 1] Control de accesos físicos
│   ├── fi-assets/         # [Phase 2] Inventario biomédico
│   ├── fi-calibration/    # [Phase 2] Calibraciones y metrología
│   ├── fi-logistics/      # [Phase 2] Insumos y compras
│   ├── fi-core/           # [Phase 3] FI-Core on-prem
│   ├── fi-tele/           # [Phase 3] Teleconsulta con memoria
│   └── fi-records/        # [Phase 3] Expediente clínico complementario
│
├── config/                 # Configuration files
│   ├── database/          # DB schemas and migrations
│   ├── docker/            # Docker compose configurations
│   └── monitoring/        # Grafana/Prometheus configs
│
├── scripts/               # Utility scripts
│   ├── setup/            # Installation and setup scripts
│   ├── migration/        # Data migration scripts
│   └── maintenance/      # Backup and maintenance scripts
│
├── docs/                  # Documentation
│   ├── architecture/     # Architecture decision records
│   ├── api/              # API documentation
│   └── deployment/       # Deployment guides
│
└── tests/                 # Test suites
    ├── unit/             # Unit tests
    ├── integration/      # Integration tests
    └── e2e/              # End-to-end tests
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x LTS
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aurity
   ```

2. **Setup environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start development environment**
   ```bash
   docker-compose up -d
   npm run dev
   ```

5. **Verify installation**
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## 💻 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run test suite
npm run type-check   # TypeScript type checking
npm run lint         # Lint code
```

### Pre-commit Hooks

Git hooks are automatically configured to:
- ✅ Prevent committing sensitive files (.env, keys, PHI data)
- ✅ Block large files (>10MB)
- ✅ Warn about debug code (console.log, debugger)
- ✅ Run TypeScript type checking

### Code Structure

```typescript
// Example: Module structure
aurity/modules/fi-cold/
├── index.ts              // Module entry point
├── types.ts              // TypeScript types
├── hooks/                // React hooks
├── components/           // UI components
├── services/             // Business logic
├── utils/                // Helper functions
└── __tests__/            // Tests
```

---

## ⚠️ Sprint Restrictions

**Sprint SPR-2025W44** has the following restrictions:

```yaml
Restrictions:
  - ❌ Sin cámaras (No camera functionality)
  - ❌ Sin PHI (No Protected Health Information)
  - ❌ Sin modo offline (No offline mode for now)

Focus:
  - ✅ Infrastructure setup
  - ✅ Non-PHI modules (FI-Cold, FI-Entry)
  - ✅ Base architecture
  - ✅ Development environment
```

---

## 📦 Module Status

| Module | Phase | Status | Priority |
|--------|-------|--------|----------|
| **FI-Cold** | 1 | 🟡 Planned | P0 |
| **FI-Entry** | 1 | 🟡 Planned | P0 |
| **FI-Assets** | 2 | ⚪ Future | P1 |
| **FI-Calibration** | 2 | ⚪ Future | P1 |
| **FI-Logistics** | 2 | ⚪ Future | P1 |
| **FI-Core** | 3 | ⚪ Future | P0 |
| **FI-Tele** | 3 | ⚪ Future | P0 |
| **FI-Records** | 3 | ⚪ Future | P0 |

**Legend:**
- 🟢 Active Development
- 🟡 Planned
- 🔵 In Review
- ⚪ Future

---

## 🤝 Contributing

### Workflow

1. Create feature branch from `main`
   ```bash
   git checkout -b feature/AU-XXX-description
   ```

2. Make changes and commit
   ```bash
   git add .
   git commit -m "feat: description"
   ```

3. Push and create PR
   ```bash
   git push origin feature/AU-XXX-description
   ```

### Commit Convention

```
feat: New feature
fix: Bug fix
docs: Documentation changes
style: Code style changes
refactor: Code refactoring
test: Test additions/changes
chore: Maintenance tasks
```

---

## 🔒 Security

### Critical Guidelines

⚠️ **NEVER commit:**
- `.env` files
- Private keys (`.pem`, `.key`)
- PHI data (patient information)
- Database dumps with real data
- Credentials or secrets

### Reporting Security Issues

Please report security vulnerabilities to: security@aurity.local

### Data Classification

```
🔴 CRITICAL (PHI)     - Patient data, medical records
🟡 SENSITIVE          - API keys, credentials, internal configs
🟢 PUBLIC             - Documentation, code (without secrets)
```

---

## 📚 Additional Resources

- [AURITY FRAMEWORK.md](../AURITY%20FRAMEWORK.md) - Complete technical specification
- [Free Intelligence Docs](https://docs.freeintelligence.io) - FI Core documentation
- [Trello Board](https://trello.com/b/77MVRL0t) - Sprint tracking

---

## 📞 Support

- **Technical Lead:** [email]
- **Trello Board:** [Aurity Framework - Development Board](https://trello.com/b/77MVRL0t)
- **Documentation:** See `/docs` directory

---

## 📄 License

**Proprietary** - All rights reserved
© 2025 Aurity Framework Team

---

**Sprint SPR-2025W44 Goals:**
- ✅ Repository structure complete
- ⏳ FI-Cold module development
- ⏳ FI-Entry module development
- ⏳ Demo script (3 cases: V/A/R)

*Last updated: 2025-10-28*
